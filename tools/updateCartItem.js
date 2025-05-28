// tools/updateCartItem.js
import {z} from 'zod';
import {BaseTool} from '../utils/baseTool.js';
import sprykerApi from '../services/sprykerApiService.js';
import {formatErrorResponse, formatSuccessResponse} from '../utils/responseFormatter.js';

const updateCartItemHandler = async ({token, cartId, itemId, quantity}) => {
    try {
        const response = await sprykerApi.patch(
            `carts/${cartId}/items/${itemId}`,
            {
                data: {
                    type: 'items',
                    attributes: {
                        quantity
                    }
                }
            },
            token
        );

        return formatSuccessResponse({
            message: 'Cart item updated successfully',
            cart: response.data.data,
            updatedItem: {
                itemId,
                quantity
            }
        });
    } catch (error) {
        return formatErrorResponse(error, 'updating cart item');
    }
};

export default function registerTool(server) {
    const tool = new BaseTool(
        'updateCartItem',
        'Updates the quantity of an item in the shopping cart',
        {
            cartId: z.string().describe('ID of the cart containing the item'),
            itemId: z.string().describe('ID of the item to update'),
            quantity: z.number().describe('New quantity for the item'),
        },
        updateCartItemHandler,
        true // Requires authentication
    );

    tool.registerTool(server);
}
