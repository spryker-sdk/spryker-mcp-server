// tools/getOrder.js
import {z} from 'zod';
import {BaseTool} from '../utils/baseTool.js';
import sprykerApi from '../services/sprykerApiService.js';
import {formatErrorResponse, formatSuccessResponse} from '../utils/responseFormatter.js';

const getOrderHandler = async ({token, orderReference}) => {
    try {
        let endpoint = 'orders';
        if (orderReference) {
            endpoint = `orders/${orderReference}`;
        }

        const response = await sprykerApi.get(endpoint, {}, token);
        
        if (!orderReference && response.data.data && response.data.data.length > 0) {
            // Return all orders
            return formatSuccessResponse({
                orders: response.data.data,
                totalOrders: response.data.data.length
            });
        } else if (orderReference) {
            // Return specific order
            return formatSuccessResponse({
                order: response.data.data
            });
        } else {
            return formatSuccessResponse({
                message: 'No orders found',
                orders: []
            });
        }
    } catch (error) {
        return formatErrorResponse(error, 'retrieving order');
    }
};

export default function registerTool(server) {
    const tool = new BaseTool(
        'getOrder',
        'Retrieves order details and history',
        {
            orderReference: z.string().optional().describe('Specific order reference to retrieve. If not provided, returns all orders'),
        },
        getOrderHandler,
        true // Requires authentication
    );

    tool.registerTool(server);
}
