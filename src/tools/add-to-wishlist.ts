/**
 * Add To Wishlist Tool
 *
 * Adds a concrete product to a registered customer's wishlist.
 */

import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

const AddToWishlistSchema = z.object({
  token: z.string().describe('Customer access token (wishlists require a registered customer)'),
  wishlistUuid: z.string().describe('UUID of the wishlist to add the item to'),
  sku: z.string().describe('Concrete product SKU to add to the wishlist'),
});

async function addToWishlist(args: z.infer<typeof AddToWishlistSchema>) {
  const apiService = SprykerApiService.getInstance();

  try {
    logger.info('Adding item to wishlist', { wishlistUuid: args.wishlistUuid, sku: args.sku });

    const response = await apiService.post(
      `wishlists/${args.wishlistUuid}/wishlist-items`,
      {
        data: {
          type: 'wishlist-items',
          attributes: { sku: args.sku },
        },
      },
      args.token
    );

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: 'Item added to wishlist successfully',
          wishlistUuid: args.wishlistUuid,
          sku: args.sku,
          wishlistItem: response.data,
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Add to wishlist failed', error as Error);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: 'Failed to add item to wishlist',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          responseData: error instanceof ApiError ? error.responseData : [],
          wishlistUuid: args.wishlistUuid,
          sku: args.sku,
        }, null, 2),
      }],
      isError: true,
    };
  }
}

export const addToWishlistTool: SprykerTool = {
  name: 'add-to-wishlist',
  description: 'Add a concrete product to a registered customer\'s wishlist.',
  inputSchema: z.toJSONSchema(AddToWishlistSchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = AddToWishlistSchema.parse(args);
    return await addToWishlist(validatedArgs);
  },
};
