// tools/removeFromCart.js
import {z} from 'zod';
import {BaseTool} from '../utils/baseTool.js';
import sprykerApi from '../services/sprykerApiService.js';
import {formatErrorResponse, formatSuccessResponse} from '../utils/responseFormatter.js';

const removeFromCartHandler = async ({token, cartId, itemId}) => {
    try {
        const response = await sprykerApi.delete(
            `carts/${cartId}/items/${itemId}`,
            token
        );

        return formatSuccessResponse({
            message: 'Item removed from cart successfully',
            cartId: cartId,
            removedItemId: itemId
        });
    } catch (error) {
        return formatErrorResponse(error, 'removing item from cart');
    }
};

export default function registerTool(server) {
    const tool = new BaseTool(
        'removeFromCart',
        'Removes an item from the shopping cart',
        {
            cartId: z.string().describe('ID of the cart containing the item'),
            itemId: z.string().describe('ID of the item to remove from cart'),
        },
        removeFromCartHandler,
        true // Requires authentication
    );

    tool.registerTool(server);
}
