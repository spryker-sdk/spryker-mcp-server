/**
 * Get Concrete Product Tool
 *
 * Retrieves detailed information about a specific concrete product (variant) by SKU.
 * Concrete products are the orderable units (the SKUs added to a cart), as opposed to
 * abstract products which group variants together.
 */

import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

const GetConcreteProductSchema = z.object({
  sku: z.string().describe('Concrete product SKU (the orderable variant) to retrieve'),
});

async function getConcreteProduct(args: z.infer<typeof GetConcreteProductSchema>) {
  const apiService = SprykerApiService.getInstance();

  try {
    logger.info('Retrieving concrete product details', { sku: args.sku });

    const response = await apiService.get<{
      data: {
        type: string;
        id: string;
        attributes: {
          sku: string;
          name: string;
          description: string;
          attributes: Record<string, unknown>;
          superAttributesDefinition?: string[];
          superAttributes?: Record<string, unknown>;
          productAbstractSku?: string;
          metaTitle?: string;
          metaKeywords?: string;
          metaDescription?: string;
          attributeNames?: Record<string, string>;
        };
      };
      included?: Array<{
        type: string;
        id: string;
        attributes: unknown;
      }>;
    }>(`concrete-products/${args.sku}?include=concrete-product-image-sets,concrete-product-availabilities,concrete-product-prices`);

    const product = response.data.data;
    const included = response.data.included || [];

    const images = included.filter(item => item.type === 'concrete-product-image-sets');
    const availability = included.filter(item => item.type === 'concrete-product-availabilities');
    const prices = included.filter(item => item.type === 'concrete-product-prices');

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: response.status === 200,
          message: 'Concrete product retrieved successfully',
          product: {
            sku: product.attributes.sku,
            name: product.attributes.name,
            description: product.attributes.description,
            attributes: product.attributes.attributes,
            superAttributes: product.attributes.superAttributes,
            productAbstractSku: product.attributes.productAbstractSku,
            metaTitle: product.attributes.metaTitle,
            metaKeywords: product.attributes.metaKeywords,
            metaDescription: product.attributes.metaDescription,
            attributeNames: product.attributes.attributeNames,
          },
          images: images.map(img => ({ id: img.id, attributes: img.attributes })),
          availability: availability.map(avail => ({ id: avail.id, attributes: avail.attributes })),
          prices: prices.map(price => ({ id: price.id, attributes: price.attributes })),
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Get concrete product failed', error as Error);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: 'Failed to retrieve concrete product',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          responseData: error instanceof ApiError ? error.responseData : [],
          sku: args.sku,
        }, null, 2),
      }],
      isError: true,
    };
  }
}

export const getConcreteProductTool: SprykerTool = {
  name: 'get-concrete-product',
  description: 'Get detailed concrete product (variant) information by SKU, including its abstract parent, super attributes, images, pricing, and availability. Concrete SKUs are what you add to a cart.',
  inputSchema: z.toJSONSchema(GetConcreteProductSchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = GetConcreteProductSchema.parse(args);
    return await getConcreteProduct(validatedArgs);
  },
};
