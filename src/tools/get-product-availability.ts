/**
 * Get Product Availability Tool
 *
 * Retrieves stock availability for an abstract or concrete product.
 */

import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

const GetProductAvailabilitySchema = z.object({
  sku: z.string().describe('Product SKU to check availability for'),
  productType: z
    .enum(['abstract', 'concrete'])
    .default('abstract')
    .describe('Whether the SKU is an abstract or concrete product'),
});

async function getProductAvailability(args: z.infer<typeof GetProductAvailabilitySchema>) {
  const apiService = SprykerApiService.getInstance();

  try {
    logger.info('Retrieving product availability', { sku: args.sku, productType: args.productType });

    const endpoint =
      args.productType === 'concrete'
        ? `concrete-products/${args.sku}/concrete-product-availabilities`
        : `abstract-products/${args.sku}/abstract-product-availabilities`;

    const response = await apiService.get<{
      data: Array<{ type: string; id: string; attributes: Record<string, unknown> }> | {
        type: string;
        id: string;
        attributes: Record<string, unknown>;
      };
    }>(endpoint);

    const data = response.data.data;
    const items = Array.isArray(data) ? data : data ? [data] : [];

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: response.status === 200,
          message: 'Product availability retrieved successfully',
          sku: args.sku,
          productType: args.productType,
          availability: items.map(item => ({ id: item.id, attributes: item.attributes })),
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Get product availability failed', error as Error);

    return {
      content: [{
        type: 'text' as const,
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

export const getProductAvailabilityTool: SprykerTool = {
  name: 'get-product-availability',
  description: 'Get stock availability for an abstract or concrete product by SKU.',
  inputSchema: z.toJSONSchema(GetProductAvailabilitySchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = GetProductAvailabilitySchema.parse(args);
    return await getProductAvailability(validatedArgs);
  },
};
