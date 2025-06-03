/**
 * Remove From Cart Tool
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {ApiError, SprykerApiService} from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

const RemoveFromCartSchema = z.object({
  token: z.string().describe('Customer access token or guest token'),
  cartId: z.string().describe('ID of the cart containing the item'),
  itemId: z.string().describe('ID of the item to remove from cart'),
});

async function removeFromCart(args: z.infer<typeof RemoveFromCartSchema>) {
  const apiService = SprykerApiService.getInstance();
  
  try {
    logger.info('Removing item from cart', { 
      cartId: args.cartId, 
      itemId: args.itemId 
    });
    
    // Remove item from cart
    const response = await apiService.delete<{
      data: {
        type: string;
        id: string;
        attributes: Record<string, unknown>;
      };
    }>(`carts/${args.cartId}/items/${args.itemId}`, args.token);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: 'Item removed from cart successfully',
          cartId: args.cartId,
          removedItemId: args.itemId,
          cart: response.data.data,
        }, null, 2),
      }],
    };
    
  } catch (error) {
    logger.error('Failed to remove item from cart', error as Error);
    
    return {
      content: [{
        type: 'text' as const,
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

export const removeFromCartTool: SprykerTool = {
  name: 'remove-from-cart',
  description: 'Remove an item from the shopping cart',
  inputSchema: zodToJsonSchema(RemoveFromCartSchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = RemoveFromCartSchema.parse(args);
    return await removeFromCart(validatedArgs);
  },
};
