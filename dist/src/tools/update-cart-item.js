/**
 * Update Cart Item Tool
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
const UpdateCartItemSchema = z.object({
    token: z.string().describe('Customer access token or guest token'),
    cartId: z.string().describe('ID of the cart containing the item'),
    itemId: z.string().describe('ID of the item to update'),
    quantity: z.number().min(1).describe('New quantity for the item'),
});
async function updateCartItem(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Updating cart item', {
            cartId: args.cartId,
            itemId: args.itemId,
            quantity: args.quantity
        });
        // Update cart item quantity
        const response = await apiService.patch(`carts/${args.cartId}/items/${args.itemId}`, {
            data: {
                type: 'items',
                attributes: {
                    quantity: args.quantity,
                },
            },
        }, args.token);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: 'Cart item updated successfully',
                        cart: response.data.data,
                        updatedItem: {
                            itemId: args.itemId,
                            quantity: args.quantity,
                        },
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Failed to update cart item', error);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Failed to update cart item',
                        message: error instanceof Error ? error.message : 'Unknown error occurred',
                        responseData: error instanceof ApiError ? error.responseData : []
                    }, null, 2),
                }],
            isError: true,
        };
    }
}
export const updateCartItemTool = {
    name: 'update-cart-item',
    description: 'Update the quantity of an item in the shopping cart',
    inputSchema: zodToJsonSchema(UpdateCartItemSchema),
    handler: async (args) => {
        const validatedArgs = UpdateCartItemSchema.parse(args);
        return await updateCartItem(validatedArgs);
    },
};
//# sourceMappingURL=update-cart-item.js.map