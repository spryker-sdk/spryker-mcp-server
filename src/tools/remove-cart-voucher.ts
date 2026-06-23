/**
 * Remove Cart Voucher Tool
 *
 * Removes a previously applied discount/voucher code from a cart (registered or guest).
 */

import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

const RemoveCartVoucherSchema = z.object({
  token: z.string().describe('Customer access token or guest customer unique ID'),
  cartId: z.string().describe('ID of the cart to remove the voucher from'),
  code: z.string().describe('Voucher / discount code to remove'),
});

function isGuest(token: string): boolean {
  return token.startsWith('guest-');
}

async function removeCartVoucher(args: z.infer<typeof RemoveCartVoucherSchema>) {
  const apiService = SprykerApiService.getInstance();

  try {
    logger.info('Removing voucher from cart', { cartId: args.cartId, code: args.code });

    const base = isGuest(args.token) ? 'guest-carts' : 'carts';
    const endpoint = `${base}/${args.cartId}/vouchers/${encodeURIComponent(args.code)}`;

    await apiService.delete(endpoint, args.token);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: 'Voucher removed successfully',
          cartId: args.cartId,
          code: args.code,
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Remove voucher failed', error as Error);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: 'Failed to remove voucher',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          responseData: error instanceof ApiError ? error.responseData : [],
          cartId: args.cartId,
          code: args.code,
        }, null, 2),
      }],
      isError: true,
    };
  }
}

export const removeCartVoucherTool: SprykerTool = {
  name: 'remove-cart-voucher',
  description: 'Remove a discount/voucher code from a registered or guest cart.',
  inputSchema: z.toJSONSchema(RemoveCartVoucherSchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = RemoveCartVoucherSchema.parse(args);
    return await removeCartVoucher(validatedArgs);
  },
};
