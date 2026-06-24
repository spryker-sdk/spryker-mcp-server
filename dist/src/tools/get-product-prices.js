/**
 * Get Product Prices Tool
 *
 * Retrieves prices (including volume prices) for an abstract or concrete product.
 */
import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
const GetProductPricesSchema = z.object({
    sku: z.string().describe('Product SKU to retrieve prices for'),
    productType: z
        .enum(['abstract', 'concrete'])
        .default('abstract')
        .describe('Whether the SKU is an abstract or concrete product'),
});
async function getProductPrices(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Retrieving product prices', { sku: args.sku, productType: args.productType });
        const endpoint = args.productType === 'concrete'
            ? `concrete-products/${args.sku}/concrete-product-prices`
            : `abstract-products/${args.sku}/abstract-product-prices`;
        const response = await apiService.get(endpoint);
        const data = response.data.data;
        const items = Array.isArray(data) ? data : data ? [data] : [];
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: response.status === 200,
                        message: 'Product prices retrieved successfully',
                        sku: args.sku,
                        productType: args.productType,
                        prices: items.map(item => ({ id: item.id, attributes: item.attributes })),
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Get product prices failed', error);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Failed to retrieve product prices',
                        message: error instanceof Error ? error.message : 'Unknown error occurred',
                        responseData: error instanceof ApiError ? error.responseData : [],
                        sku: args.sku,
                    }, null, 2),
                }],
            isError: true,
        };
    }
}
export const getProductPricesTool = {
    name: 'get-product-prices',
    description: 'Get prices, including volume prices, for an abstract or concrete product by SKU.',
    inputSchema: z.toJSONSchema(GetProductPricesSchema),
    handler: async (args) => {
        const validatedArgs = GetProductPricesSchema.parse(args);
        return await getProductPrices(validatedArgs);
    },
};
//# sourceMappingURL=get-product-prices.js.map