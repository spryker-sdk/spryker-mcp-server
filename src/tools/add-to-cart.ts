/**
 * Add to Cart Tool
 * 
 * Adds products to a customer's shopping cart
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {ApiError, SprykerApiService} from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

/**
 * Input schema for add to cart
 */
const AddToCartSchema = z.object({
  sku: z.string().describe('Product Concrete SKU to add to cart'),
  quantity: z.number().min(1).default(1).describe('Quantity to add'),
  cartId: z.string().optional().describe('Cart ID to add the item to (optional, will create a new cart if not provided)'),
  token: z.string().describe('Customer authentication token'),
});

type AddToCartInput = z.infer<typeof AddToCartSchema>;

/**
 * Add product to cart implementation
 */
async function addToCart(args: AddToCartInput) {
  const apiService = SprykerApiService.getInstance();
  
  try {
    logger.info('Adding product to cart', { sku: args.sku, quantity: args.quantity });
    
    // First, create a cart if one doesn't exist or get existing cart (matching JavaScript version)
    let cartResponse;
    try {
      // Try to get existing cart
      const cartsResponse = await apiService.get('carts', args.token);

      // Handle case where response.data might have nested data property (Spryker API format)
      let cartData = cartsResponse.data;
      if (cartsResponse.data && typeof cartsResponse.data === 'object' && 'data' in cartsResponse.data) {
        cartData = (cartsResponse.data as any).data;
      }

      if (Array.isArray(cartData) && cartData.length > 0) {
        cartResponse = cartData[0]; // Use first available cart
      } else {
        // Create new cart if none exists
        const newCartResponse = await apiService.post('carts', {
          data: {
            type: 'carts',
            attributes: {}
          }
        }, args.token);
        cartResponse = newCartResponse.data;
      }
    } catch (error) {
      // If cart retrieval fails, try to create a new one
      const newCartResponse = await apiService.post('carts', {
        data: {
          type: 'carts',
          attributes: {}
        }
      }, args.token);
      cartResponse = newCartResponse.data;
    }

    const cartId = (cartResponse as any).id;

    // Add item to cart
    const response = await apiService.post(
      `carts/${cartId}/items`,
      {
        data: {
          type: 'items',
          attributes: {
            sku: args.sku,
            quantity: args.quantity
          }
        }
      },
      args.token
    );

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: 'Item added to cart successfully',
          cart: response.data,
          cartId,
          addedItem: {
            sku: args.sku,
            quantity: args.quantity
          }
        }, null, 2)
      }]
    };
  } catch (error: unknown) {
    logger.error('Failed to add product to cart', { error, sku: args.sku });
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'adding item to cart',
          responseData: error instanceof ApiError ? error.responseData : []
        }, null, 2)
      }],
      isError: true,
    };
  }
}
/**
 * Add to cart tool definition
 */
export const addToCartTool: SprykerTool = {
  name: 'add-to-cart',
  description: 'Add a concrete product to the logged in customer\'s shopping cart',
  inputSchema: zodToJsonSchema(AddToCartSchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = AddToCartSchema.parse(args);
    return await addToCart(validatedArgs);
  },
};
