/**
 * Get Category Tool
 *
 * Retrieves a single category node by its ID, including its attributes and child nodes.
 */

import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

const GetCategorySchema = z.object({
  categoryNodeId: z.string().describe('Category node ID to retrieve'),
});

async function getCategory(args: z.infer<typeof GetCategorySchema>) {
  const apiService = SprykerApiService.getInstance();

  try {
    logger.info('Retrieving category node', { categoryNodeId: args.categoryNodeId });

    const response = await apiService.get<{
      data: { type: string; id: string; attributes: Record<string, unknown> };
    }>(`category-nodes/${args.categoryNodeId}`);

    const node = response.data.data;

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: response.status === 200,
          message: 'Category retrieved successfully',
          category: { id: node.id, attributes: node.attributes },
          hint: 'To list products in this category, use product-search with a valueFacet for the category.',
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Get category failed', error as Error);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: 'Failed to retrieve category',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          responseData: error instanceof ApiError ? error.responseData : [],
          categoryNodeId: args.categoryNodeId,
        }, null, 2),
      }],
      isError: true,
    };
  }
}

export const getCategoryTool: SprykerTool = {
  name: 'get-category',
  description: 'Get a category node by ID, including its attributes and child categories.',
  inputSchema: z.toJSONSchema(GetCategorySchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = GetCategorySchema.parse(args);
    return await getCategory(validatedArgs);
  },
};
