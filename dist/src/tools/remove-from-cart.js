/**
 * Remove From Cart Tool
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
const RemoveFromCartSchema = z.object({
    token: z.string().describe('Customer access token or guest token'),
    cartId: z.string().describe('ID of the cart containing the item'),
    itemId: z.string().describe('ID of the item to remove from cart'),
});
async function removeFromCart(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Removing item from cart', {
            cartId: args.cartId,
            itemId: args.itemId
        });
        // Remove item from cart
        const response = await apiService.delete(`carts/${args.cartId}/items/${args.itemId}`, args.token);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: 'Item removed from cart successfully',
                        cartId: args.cartId,
                        removedItemId: args.itemId,
                        cart: response.data.data,
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Failed to remove item from cart', error);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Failed to remove item from cart',
                        message: error instanceof Error ? error.message : 'Unknown error occurred',
                        responseData: error instanceof ApiError ? error.responseData : []
                    }, null, 2),
                }],
            isError: true,
        };
    }
}
export const removeFromCartTool = {
    name: 'remove-from-cart',
    description: 'Remove an item from the shopping cart',
    inputSchema: zodToJsonSchema(RemoveFromCartSchema),
    handler: async (args) => {
        const validatedArgs = RemoveFromCartSchema.parse(args);
        return await removeFromCart(validatedArgs);
    },
};
//# sourceMappingURL=remove-from-cart.js.map