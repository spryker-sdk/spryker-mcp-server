/**
 * Get Cart Tool
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {ApiError, SprykerApiService} from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

const GetCartSchema = z.object({
  token: z.string().describe('Customer authentication token or guest customer unique ID'),
  cartId: z.string().optional().describe('Specific cart ID to retrieve. If not provided, returns all carts or the first available cart'),
});

async function getCart(args: z.infer<typeof GetCartSchema>) {
  const apiService = SprykerApiService.getInstance();
  
  try {
    logger.info('Retrieving cart');
    
    let endpoint;
    
    // Determine if this is a guest or authenticated request (matching JavaScript version)
    if (args.token && args.token.startsWith('guest-')) {
      endpoint = args.cartId ? `guest-carts/${args.cartId}` : 'guest-carts';
    } else {
      endpoint = args.cartId ? `carts/${args.cartId}` : 'carts';
    }

    const response = await apiService.get(endpoint, args.token);

    // Handle case where response.data might have nested data property (Spryker API format)
    let cartData = response.data;
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      cartData = (response.data as any).data;
    }

    if (!args.cartId && cartData && Array.isArray(cartData) && cartData.length > 0) {
      // Return the first cart if no specific cart ID was requested
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            cart: cartData[0],
            totalCarts: cartData.length
          }, null, 2)
        }]
      };
    } else if (args.cartId) {
      // Return specific cart (use original response.data for specific cart requests)
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            cart: response.data
          }, null, 2)
        }]
      };
    } else {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: 'No carts found',
            carts: []
          }, null, 2)
        }]
      };
    }
  } catch (error: unknown) {
    logger.error('Failed to retrieve cart', { error });
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'retrieving cart',
          responseData: error instanceof ApiError ? error.responseData : []
        }, null, 2)
      }],
      isError: true,
    };
  }
}

export const getCartTool: SprykerTool = {
  name: 'get-cart',
  description: 'Get customer\'s shopping cart contents',
  inputSchema: zodToJsonSchema(GetCartSchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = GetCartSchema.parse(args);
    return await getCart(validatedArgs);
  },
};
