/**
 * Wishlist To Cart Tool
 *
 * Moves all items from a registered customer's wishlist into a cart.
 * Reads the wishlist items, then adds each concrete SKU to the given cart.
 */
import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
const WishlistToCartSchema = z.object({
    token: z.string().describe('Customer access token (wishlists require a registered customer)'),
    wishlistUuid: z.string().describe('UUID of the wishlist to copy items from'),
    cartId: z.string().describe('ID of the cart to add the wishlist items to'),
});
async function wishlistToCart(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Moving wishlist items to cart', { wishlistUuid: args.wishlistUuid, cartId: args.cartId });
        const wishlistResponse = await apiService.get(`wishlists/${args.wishlistUuid}?include=wishlist-items`, args.token);
        const items = (wishlistResponse.data.included || []).filter(item => item.type === 'wishlist-items');
        const skus = items.map(item => item.attributes?.sku).filter((sku) => Boolean(sku));
        const added = [];
        const failed = [];
        for (const sku of skus) {
            try {
                await apiService.post(`carts/${args.cartId}/items`, { data: { type: 'items', attributes: { sku, quantity: 1 } } }, args.token);
                added.push(sku);
            }
            catch (itemError) {
                failed.push({
                    sku,
                    message: itemError instanceof Error ? itemError.message : 'Unknown error occurred',
                });
            }
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: failed.length === 0,
                        message: `Added ${added.length} of ${skus.length} wishlist items to the cart`,
                        wishlistUuid: args.wishlistUuid,
                        cartId: args.cartId,
                        added,
                        failed,
                    }, null, 2),
                }],
            ...(failed.length > 0 ? { isError: true } : {}),
        };
    }
    catch (error) {
        logger.error('Wishlist to cart failed', error);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Failed to move wishlist items to cart',
                        message: error instanceof Error ? error.message : 'Unknown error occurred',
                        responseData: error instanceof ApiError ? error.responseData : [],
                        wishlistUuid: args.wishlistUuid,
                        cartId: args.cartId,
                    }, null, 2),
                }],
            isError: true,
        };
    }
}
export const wishlistToCartTool = {
    name: 'wishlist-to-cart',
    description: 'Move all items from a registered customer\'s wishlist into a cart.',
    availability: { models: ['b2c'] },
    inputSchema: z.toJSONSchema(WishlistToCartSchema),
    handler: async (args) => {
        const validatedArgs = WishlistToCartSchema.parse(args);
        return await wishlistToCart(validatedArgs);
    },
};
//# sourceMappingURL=wishlist-to-cart.js.map