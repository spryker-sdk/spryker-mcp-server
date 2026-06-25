/**
 * Create Wishlist Tool
 *
 * Creates a new wishlist for a registered customer.
 */
import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
const CreateWishlistSchema = z.object({
    token: z.string().describe('Customer access token (wishlists require a registered customer)'),
    name: z.string().describe('Name of the new wishlist'),
});
async function createWishlist(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Creating wishlist', { name: args.name });
        const response = await apiService.post('wishlists', {
            data: {
                type: 'wishlists',
                attributes: { name: args.name },
            },
        }, args.token);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: 'Wishlist created successfully',
                        wishlist: response.data,
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Create wishlist failed', error);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Failed to create wishlist',
                        message: error instanceof Error ? error.message : 'Unknown error occurred',
                        responseData: error instanceof ApiError ? error.responseData : [],
                        name: args.name,
                    }, null, 2),
                }],
            isError: true,
        };
    }
}
export const createWishlistTool = {
    name: 'create-wishlist',
    description: 'Create a new wishlist for a registered customer.',
    availability: { models: ['b2c'] },
    inputSchema: z.toJSONSchema(CreateWishlistSchema),
    handler: async (args) => {
        const validatedArgs = CreateWishlistSchema.parse(args);
        return await createWishlist(validatedArgs);
    },
};
//# sourceMappingURL=create-wishlist.js.map