/**
 * Get Category Tree Tool
 *
 * Retrieves the full category tree for catalog navigation.
 */
import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
const GetCategoryTreeSchema = z.object({});
async function getCategoryTree(_args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Retrieving category tree');
        const response = await apiService.get('category-trees');
        const data = response.data.data;
        const categories = Array.isArray(data) ? data : data ? [data] : [];
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: response.status === 200,
                        message: 'Category tree retrieved successfully',
                        categories: categories.map(node => ({ id: node.id, attributes: node.attributes })),
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Get category tree failed', error);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Failed to retrieve category tree',
                        message: error instanceof Error ? error.message : 'Unknown error occurred',
                        responseData: error instanceof ApiError ? error.responseData : [],
                    }, null, 2),
                }],
            isError: true,
        };
    }
}
export const getCategoryTreeTool = {
    name: 'get-category-tree',
    description: 'Get the full catalog category tree for navigation and browsing.',
    inputSchema: z.toJSONSchema(GetCategoryTreeSchema),
    handler: async (args) => {
        const validatedArgs = GetCategoryTreeSchema.parse(args);
        return await getCategoryTree(validatedArgs);
    },
};
//# sourceMappingURL=get-category-tree.js.map