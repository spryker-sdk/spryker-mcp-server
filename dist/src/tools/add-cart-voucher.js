/**
 * Add Cart Voucher Tool
 *
 * Applies a discount/voucher code to a cart (registered or guest).
 */
import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
const AddCartVoucherSchema = z.object({
    token: z.string().describe('Customer access token or guest customer unique ID'),
    cartId: z.string().describe('ID of the cart to apply the voucher to'),
    code: z.string().describe('Voucher / discount code to apply'),
});
function isGuest(token) {
    return token.startsWith('guest-');
}
async function addCartVoucher(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Applying voucher to cart', { cartId: args.cartId });
        const guest = isGuest(args.token);
        const endpoint = guest
            ? `guest-carts/${args.cartId}/vouchers`
            : `carts/${args.cartId}/vouchers`;
        const resourceType = guest ? 'guest-cart-vouchers' : 'cart-vouchers';
        const response = await apiService.post(endpoint, {
            data: {
                type: resourceType,
                attributes: { code: args.code },
            },
        }, args.token);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: 'Voucher applied successfully',
                        cartId: args.cartId,
                        code: args.code,
                        cart: response.data,
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Apply voucher failed', error);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Failed to apply voucher',
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
export const addCartVoucherTool = {
    name: 'add-cart-voucher',
    description: 'Apply a discount/voucher code to a registered or guest cart.',
    inputSchema: z.toJSONSchema(AddCartVoucherSchema),
    handler: async (args) => {
        const validatedArgs = AddCartVoucherSchema.parse(args);
        return await addCartVoucher(validatedArgs);
    },
};
//# sourceMappingURL=add-cart-voucher.js.map