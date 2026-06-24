/**
 * Get Product Availability Tool
 *
 * Retrieves stock availability for an abstract or concrete product.
 */
import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
const GetProductAvailabilitySchema = z.object({
    sku: z.string().describe('Product SKU to check availability for'),
    productType: z
        .enum(['abstract', 'concrete'])
        .default('abstract')
        .describe('Whether the SKU is an abstract or concrete product'),
});
async function getProductAvailability(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Retrieving product availability', { sku: args.sku, productType: args.productType });
        const endpoint = args.productType === 'concrete'
            ? `concrete-products/${args.sku}/concrete-product-availabilities`
            : `abstract-products/${args.sku}/abstract-product-availabilities`;
        const response = await apiService.get(endpoint);
        const data = response.data.data;
        const items = Array.isArray(data) ? data : data ? [data] : [];
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: response.status === 200,
                        message: 'Product availability retrieved successfully',
                        sku: args.sku,
                        productType: args.productType,
                        availability: items.map(item => ({ id: item.id, attributes: item.attributes })),
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Get product availability failed', error);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Failed to retrieve product availability',
                        message: error instanceof Error ? error.message : 'Unknown error occurred',
                        responseData: error instanceof ApiError ? error.responseData : [],
                        sku: args.sku,
                    }, null, 2),
                }],
            isError: true,
        };
    }
}
export const getProductAvailabilityTool = {
    name: 'get-product-availability',
    description: 'Get stock availability for an abstract or concrete product by SKU.',
    inputSchema: z.toJSONSchema(GetProductAvailabilitySchema),
    handler: async (args) => {
        const validatedArgs = GetProductAvailabilitySchema.parse(args);
        return await getProductAvailability(validatedArgs);
    },
};
//# sourceMappingURL=get-product-availability.js.map