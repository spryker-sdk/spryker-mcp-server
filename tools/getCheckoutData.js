// tools/getCheckoutData.js
import {z} from 'zod';
import {BaseTool} from '../utils/baseTool.js';
import sprykerApi from '../services/sprykerApiService.js';
import {formatErrorResponse, formatSuccessResponse} from '../utils/responseFormatter.js';

const getCheckoutDataHandler = async ({token, cartId}) => {
    try {
        let paymentMethods = [];
        let shipmentMethods = [];
        let customerAddresses = [];
        let checkoutData = null;
        let errors = [];

        // Try to get checkout data using POST with cart information
        const checkoutDataPayload = {
            data: {
                type: 'checkout-data',
                attributes: {
                    idCart: cartId
                }
            }
        };

        const checkoutDataResponse = await sprykerApi.post('checkout-data?include=payment-methods,shipments,shipment-methods,addresses', checkoutDataPayload, token);
        checkoutData = checkoutDataResponse.data.data || {};
        const included = checkoutDataResponse.data.included || [];

        // Parse included data to extract payment and shipment methods
        paymentMethods = included.filter(item => item.type === 'payment-methods');
        shipmentMethods = included.filter(item => item.type === 'shipment-methods');
        customerAddresses = included.filter(item => item.type === 'addresses');

        // Return success with whatever data we could retrieve
        const result = {
            checkoutData: checkoutData,
            paymentMethods: paymentMethods,
            shipmentMethods: shipmentMethods,
            customerAddresses: customerAddresses,
            message: 'Checkout data retrieved successfully',
            availableData: {
                hasCheckoutData: !!checkoutData,
                paymentMethodsCount: paymentMethods.length,
                shipmentMethodsCount: shipmentMethods.length
            }
        };

        if (errors.length > 0) {
            result.warnings = errors;
        }

        return formatSuccessResponse(result);
    } catch (error) {
        return formatErrorResponse(error, 'retrieving checkout data');
    }
};

export default function registerTool(server) {
    const tool = new BaseTool(
        'getCheckoutData',
        'Retrieves checkout data including available payment methods, shipping methods, and cart details. Must be executed before checkout to get possible data. Uses POST requests to checkout-data endpoint for specific cart, falls back to individual endpoints (supports both authenticated and guest users)',
        {
            cartId: z.string().describe('Cart ID to get cart-specific checkout data (recommended for full checkout data)'),
        },
        getCheckoutDataHandler,
        true // Requires authentication
    );

    tool.registerTool(server);
}
