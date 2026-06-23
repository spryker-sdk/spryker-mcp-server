/**
 * Get Product Reviews Tool
 *
 * Retrieves customer reviews and ratings for an abstract product.
 */
import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
const GetProductReviewsSchema = z.object({
    sku: z.string().describe('Abstract product SKU to retrieve reviews for'),
});
async function getProductReviews(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Retrieving product reviews', { sku: args.sku });
        const response = await apiService.get(`abstract-products/${args.sku}/product-reviews`);
        const data = response.data.data;
        const reviews = Array.isArray(data) ? data : [];
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: response.status === 200,
                        message: 'Product reviews retrieved successfully',
                        sku: args.sku,
                        count: reviews.length,
                        reviews: reviews.map(review => ({ id: review.id, attributes: review.attributes })),
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Get product reviews failed', error);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Failed to retrieve product reviews',
                        message: error instanceof Error ? error.message : 'Unknown error occurred',
                        responseData: error instanceof ApiError ? error.responseData : [],
                        sku: args.sku,
                    }, null, 2),
                }],
            isError: true,
        };
    }
}
export const getProductReviewsTool = {
    name: 'get-product-reviews',
    description: 'Get customer reviews and ratings for an abstract product by SKU.',
    inputSchema: z.toJSONSchema(GetProductReviewsSchema),
    handler: async (args) => {
        const validatedArgs = GetProductReviewsSchema.parse(args);
        return await getProductReviews(validatedArgs);
    },
};
//# sourceMappingURL=get-product-reviews.js.map