// tools/getCart.js
import {z} from 'zod';
import {BaseTool} from '../utils/baseTool.js';
import sprykerApi from '../services/sprykerApiService.js';
import {formatErrorResponse, formatSuccessResponse} from '../utils/responseFormatter.js';

const getCartHandler = async ({token, cartId}) => {
    try {
        let endpoint;
        let guestId = null;
        
        // Determine if this is a guest or authenticated request
        if (token && token.startsWith('guest-')) {
            guestId = token;
            endpoint = cartId ? `guest-carts/${cartId}` : 'guest-carts';
        } else {
            endpoint = cartId ? `carts/${cartId}` : 'carts';
        }

        const response = await sprykerApi.get(endpoint, {}, token);
        
        if (!cartId && response.data.data && response.data.data.length > 0) {
            // Return the first cart if no specific cart ID was requested
            return formatSuccessResponse({
                cart: response.data.data[0],
                totalCarts: response.data.data.length
            });
        } else if (cartId) {
            // Return specific cart
            return formatSuccessResponse({
                cart: response.data.data
            });
        } else {
            return formatSuccessResponse({
                message: 'No carts found',
                carts: []
            });
        }
    } catch (error) {
        return formatErrorResponse(error, 'retrieving cart');
    }
};

export default function registerTool(server) {
    const tool = new BaseTool(
        'getCart',
        'Retrieves shopping cart contents and details',
        {
            cartId: z.string().optional().describe('Specific cart ID to retrieve. If not provided, returns all carts or the first available cart'),
        },
        getCartHandler,
        false // Updated to not require authentication (supports both guest and authenticated)
    );

    tool.registerTool(server);
}
