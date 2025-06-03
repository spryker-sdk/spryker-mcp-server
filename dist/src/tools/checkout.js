/**
 * Checkout Tool
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
const CheckoutSchema = z.object({
    token: z.string().describe('Authentication token for the customer'),
    cartId: z.string().describe('ID of the cart to checkout'),
    customerData: z.object({
        email: z.string().email().describe('Customer email address (important to have proper data to get order confirmation email)'),
        firstName: z.string().describe('Customer first name'),
        lastName: z.string().describe('Customer last name'),
        salutation: z.string().optional().describe('Customer salutation (Mr, Mrs, Ms)'),
    }).describe('Customer data for authenticated checkout (optional for guest checkout)'),
    billingAddress: z.object({
        salutation: z.string().optional().describe('Salutation (Mr, Mrs, Ms)'),
        firstName: z.string().describe('First name'),
        lastName: z.string().describe('Last name'),
        address1: z.string().describe('Primary address line'),
        address2: z.string().describe('Secondary address line'),
        zipCode: z.string().describe('ZIP/Postal code'),
        city: z.string().describe('City'),
        country: z.string().optional().describe('Country ISO2 code (default: DE)'),
        company: z.string().optional().describe('Company name'),
        phone: z.string().optional().describe('Phone number')
    }).describe('Billing address information'),
    shippingAddress: z.object({
        salutation: z.string().optional().describe('Salutation (Mr, Mrs, Ms)'),
        firstName: z.string().describe('First name'),
        lastName: z.string().describe('Last name'),
        address1: z.string().describe('Primary address line'),
        address2: z.string().describe('Secondary address line'),
        zipCode: z.string().describe('ZIP/Postal code'),
        city: z.string().describe('City'),
        country: z.string().optional().describe('Country ISO2 code'),
        company: z.string().optional().describe('Company name'),
        phone: z.string().optional().describe('Phone number')
    }).describe('Shipping address information'),
    paymentMethod: z.object({
        provider: z.string().optional().describe('Payment provider name (default: DummyPayment)'),
        method: z.string().optional().describe('Payment method (default: invoice)')
    }).describe('Payment method information'),
    shipmentMethod: z.object({
        id: z.number().describe('Shipment method ID')
    }).describe('Shipment method information')
});
async function checkout(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Processing checkout');
        // Step 1: Create checkout request with provided or default payment/shipping methods
        const billingAddress = {
            salutation: args.shippingAddress.salutation,
            firstName: args.shippingAddress.firstName,
            lastName: args.shippingAddress.lastName,
            address1: args.shippingAddress.address1,
            address2: args.shippingAddress.address2,
            zipCode: args.shippingAddress.zipCode,
            city: args.shippingAddress.city,
            iso2Code: args.shippingAddress.country || 'DE',
            company: args.shippingAddress.company,
            phone: args.shippingAddress.phone
        };
        const shippingAddress = {
            salutation: args.billingAddress.salutation,
            firstName: args.billingAddress.firstName,
            lastName: args.billingAddress.lastName,
            address1: args.billingAddress.address1,
            address2: args.billingAddress.address2,
            zipCode: args.billingAddress.zipCode,
            city: args.billingAddress.city,
            iso2Code: args.billingAddress.country || 'DE',
            company: args.billingAddress.company,
            phone: args.billingAddress.phone
        };
        const checkoutRequest = {
            data: {
                type: 'checkout',
                attributes: {
                    customer: args.customerData,
                    idCart: args.cartId,
                    billingAddress,
                    shippingAddress,
                    payments: [
                        {
                            paymentMethodName: args.paymentMethod.method || 'invoice',
                            paymentProviderName: args.paymentMethod.provider || "DummyPayment"
                        },
                    ],
                    shipment: {
                        idShipmentMethod: args.shipmentMethod.id,
                    },
                },
            },
        };
        // Step 2: Process the checkout
        const checkoutResponse = await apiService.post('checkout', checkoutRequest, args.token);
        const orderData = checkoutResponse.data.data;
        if (orderData.attributes.isExternalRedirect) {
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            message: 'Order created successfully, but requires external payment',
                            order: {
                                orderReference: orderData.attributes.orderReference,
                                paymentUrl: orderData.attributes.redirectUrl,
                                requiresImmediatePayment: true,
                            },
                            paymentInstructions: {
                                action: 'REDIRECT_NOW',
                                url: orderData.attributes.redirectUrl,
                                timeout: 30 * 60 * 1000, // 30 minutes in milliseconds
                            },
                            nextStep: 'Please complete your payment to finalize the order',
                            "displaySettings": {
                                "paymentButton": {
                                    "prominence": "high",
                                    "style": "attention-grabbing",
                                    "colors": {
                                        "background": "#007bff",
                                        "text": "white",
                                        "border": "#0056b3"
                                    },
                                    "effects": ["glow", "hover-animation"],
                                    "text": "🚀 Complete Your Payment"
                                }
                            },
                            alerts: [{
                                    type: 'PAYMENT_PENDING',
                                    message: 'Order will be cancelled if payment not completed within 30 minutes',
                                }],
                        }, null, 2),
                    }],
            };
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: 'Order created successfully',
                        order: {
                            orderReference: orderData.attributes.orderReference,
                            redirectUrl: orderData.attributes.redirectUrl,
                        }
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Checkout failed', error);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Checkout failed',
                        message: error instanceof Error ? error.message : 'Unknown error occurred',
                        responseData: error instanceof ApiError ? error.responseData : []
                    }, null, 2),
                }],
            isError: true,
        };
    }
}
export const checkoutTool = {
    name: 'checkout',
    description: 'Process checkout for customer\'s cart',
    inputSchema: zodToJsonSchema(CheckoutSchema),
    handler: async (args) => {
        const validatedArgs = CheckoutSchema.parse(args);
        return await checkout(validatedArgs);
    },
};
//# sourceMappingURL=checkout.js.map