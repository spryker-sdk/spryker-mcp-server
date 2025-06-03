/**
 * Guest Add to Cart Tool
 *
 * Adds products to a guest user's shopping cart
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
const GuestAddToCartSchema = z.object({
    sku: z.string().describe('Product Concrete SKU to add to cart'),
    quantity: z.number().min(1).default(1).describe('Quantity to add'),
    token: z.string().describe('Guest customer unique ID (token provide by authentication)'),
});
async function guestAddToCart(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Adding product to guest cart', { sku: args.sku, quantity: args.quantity, token: args.token });
        // Use simple post method like JavaScript version
        const response = await apiService.post('guest-cart-items', {
            data: {
                type: 'guest-cart-items',
                attributes: {
                    sku: args.sku,
                    quantity: args.quantity
                }
            }
        }, args.token);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        cart: response.data,
                        token: args.token,
                        message: `Added ${args.quantity} x ${args.sku} to guest cart`
                    }, null, 2)
                }]
        };
    }
    catch (error) {
        logger.error('Failed to add product to guest cart', { error, sku: args.sku });
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to add item to guest cart',
                        responseData: error instanceof ApiError ? error.responseData : []
                    }, null, 2)
                }],
            isError: true,
        };
    }
}
export const guestAddToCartTool = {
    name: 'guest-add-to-cart',
    description: 'Adds a Concrete Product to guest cart for anonymous checkout',
    inputSchema: zodToJsonSchema(GuestAddToCartSchema),
    handler: async (args) => {
        const validatedArgs = GuestAddToCartSchema.parse(args);
        return await guestAddToCart(validatedArgs);
    },
};
//# sourceMappingURL=guest-add-to-cart.js.map