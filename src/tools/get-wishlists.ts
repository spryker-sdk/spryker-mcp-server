/**
 * Get Wishlists Tool
 *
 * Retrieves a registered customer's wishlists, or a single wishlist with its items.
 */

import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

const GetWishlistsSchema = z.object({
  token: z.string().describe('Customer access token (wishlists require a registered customer)'),
  wishlistUuid: z
    .string()
    .optional()
    .describe('Specific wishlist UUID to retrieve with its items. If omitted, all wishlists are returned.'),
});

async function getWishlists(args: z.infer<typeof GetWishlistsSchema>) {
  const apiService = SprykerApiService.getInstance();

  try {
    logger.info('Retrieving wishlists', { wishlistUuid: args.wishlistUuid || 'all' });

    const endpoint = args.wishlistUuid
      ? `wishlists/${args.wishlistUuid}?include=wishlist-items`
      : 'wishlists';

    const response = await apiService.get<{
      data: Array<{ type: string; id: string; attributes: Record<string, unknown> }> | {
        type: string;
        id: string;
        attributes: Record<string, unknown>;
      };
      included?: Array<{ type: string; id: string; attributes: unknown }>;
    }>(endpoint, args.token);

    const data = response.data.data;
    const wishlists = Array.isArray(data) ? data : data ? [data] : [];
    const items = (response.data.included || []).filter(item => item.type === 'wishlist-items');

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: response.status === 200,
          message: 'Wishlists retrieved successfully',
          wishlists: wishlists.map(w => ({ id: w.id, attributes: w.attributes })),
          items: items.map(i => ({ id: i.id, attributes: i.attributes })),
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Get wishlists failed', error as Error);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: 'Failed to retrieve wishlists',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          responseData: error instanceof ApiError ? error.responseData : [],
        }, null, 2),
      }],
      isError: true,
    };
  }
}

export const getWishlistsTool: SprykerTool = {
  name: 'get-wishlists',
  description: 'Get a registered customer\'s wishlists, or a single wishlist with its items when a UUID is given.',
  availability: { models: ['b2c'] },
  inputSchema: z.toJSONSchema(GetWishlistsSchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = GetWishlistsSchema.parse(args);
    return await getWishlists(validatedArgs);
  },
};
