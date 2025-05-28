// tools/checkout.js
import {z} from 'zod';
import {BaseTool} from '../utils/baseTool.js';
import sprykerApi from '../services/sprykerApiService.js';
import {formatErrorResponse, formatSuccessResponse} from '../utils/responseFormatter.js';

const checkoutHandler = async ({token, cartId, customerData, billingAddress, shippingAddress, paymentMethod, shipmentMethod}) => {
    try {
        //Step 1: Create checkout data
        const checkoutData = {
            data: {
                type: 'checkout-data',
                attributes: {
                    customer: {
                        email: customerData?.email || '',
                        firstName: customerData?.firstName || billingAddress.firstName,
                        lastName: customerData?.lastName || billingAddress.lastName,
                        salutation: customerData?.salutation || billingAddress.salutation || 'Mr'
                     },
                    idCart: cartId,
                    billingAddress: {
                        salutation: billingAddress.salutation || 'Mr',
                        firstName: billingAddress.firstName,
                        lastName: billingAddress.lastName,
                        address1: billingAddress.address1,
                        address2: billingAddress.address2 || 'n/a',
                        zipCode: billingAddress.zipCode,
                        city: billingAddress.city,
                        iso2Code: billingAddress.country || 'DE',
                        company: billingAddress.company || '',
                        phone: billingAddress.phone || ''
                    },
                    shippingAddress: {
                        salutation: shippingAddress?.salutation || billingAddress.salutation || 'Mr',
                        firstName: shippingAddress?.firstName || billingAddress.firstName,
                        lastName: shippingAddress?.lastName || billingAddress.lastName,
                        address1: shippingAddress?.address1 || billingAddress.address1,
                        address2: shippingAddress?.address2 || billingAddress.address2 || 'n/a',
                        zipCode: shippingAddress?.zipCode || billingAddress.zipCode,
                        city: shippingAddress?.city || billingAddress.city,
                        iso2Code: shippingAddress?.country || billingAddress.country || 'DE',
                        company: shippingAddress?.company || billingAddress.company || '',
                        phone: shippingAddress?.phone || billingAddress.phone || ''
                    },
                    payments: [{
                        paymentProviderName: paymentMethod.provider || 'DummyPayment',
                        paymentMethodName: paymentMethod.method || 'invoice'
                    }],
                    shipment: {
                        idShipmentMethod: shipmentMethod.id || 1
                    }
                }
            }
        };


        // Step 2: Submit checkout data
        const checkoutResponse = await sprykerApi.post('checkout-data', checkoutData, token);

        // Step 3: Process the order
        const orderData = {
            data: {
                type: 'checkout',
                attributes: {
                    customer: checkoutData.data.attributes.customer,
                    idCart: cartId,
                    billingAddress: checkoutData.data.attributes.billingAddress,
                    shippingAddress: checkoutData.data.attributes.shippingAddress,
                    payments: checkoutData.data.attributes.payments,
                    shipment: checkoutData.data.attributes.shipment
                }
            }
        };

        const orderResponse = await sprykerApi.post('checkout?include=orders,order-shipments', orderData, token);

        return formatSuccessResponse({
            message: 'Order placed successfully',
            order: orderResponse.data.data.attributes.orderReference,
            redirectToPaymentPage: orderResponse.data.data.attributes.redirectUrl,
            checkoutData: checkoutResponse.data.data
        });
    } catch (error) {
        return formatErrorResponse(error, 'processing checkout');
    }
};

export default function registerTool(server) {
    const tool = new BaseTool(
        'checkout',
        'Process checkout and place an order (supports both authenticated and guest checkout)',
        {
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
        },
        checkoutHandler,
        true
    );

    tool.registerTool(server);
}
