/**
 * Get Product Tool
 * 
 * Retrieves detailed information about a specific product by SKU
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {ApiError, SprykerApiService} from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

const GetProductSchema = z.object({
  sku: z.string().describe('Product Abstract SKU to retrieve'),
});

async function getProduct(args: z.infer<typeof GetProductSchema>) {
  const apiService = SprykerApiService.getInstance();
  
  try {
    logger.info('Retrieving product details', { sku: args.sku });
    
    // Get abstract product details
    const response = await apiService.get<{
      data: {
        type: string;
        id: string;
        attributes: {
          sku: string;
          name: string;
          description: string;
          attributes: Record<string, any>;
          superAttributesDefinition: string[];
          attributeMap: Record<string, any>;
          metaTitle: string;
          metaKeywords: string;
          metaDescription: string;
          attributeNames: Record<string, string>;
          url: string;
        };
        relationships?: {
          'abstract-product-image-sets'?: {
            data: Array<{
              type: string;
              id: string;
            }>;
          };
          'abstract-product-availabilities'?: {
            data: Array<{
              type: string;
              id: string;
            }>;
          };
          'abstract-product-prices'?: {
            data: Array<{
              type: string;
              id: string;
            }>;
          };
          'category-nodes'?: {
            data: Array<{
              type: string;
              id: string;
            }>;
          };
        };
      };
      included?: Array<{
        type: string;
        id: string;
        attributes: unknown;
      }>;
    }>(`abstract-products/${args.sku}?include=abstract-product-image-sets,abstract-product-availabilities,abstract-product-prices,category-nodes`);

    const product = response.data.data;
    const included = response.data.included || [];

    // Extract related data from included
    const images = included.filter(item => item.type === 'abstract-product-image-sets');
    const availability = included.filter(item => item.type === 'abstract-product-availabilities');
    const prices = included.filter(item => item.type === 'abstract-product-prices');
    const categories = included.filter(item => item.type === 'category-nodes');

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: response.status === 200,
          message: 'Product retrieved successfully',
          product: {
            sku: product.attributes.sku,
            name: product.attributes.name,
            description: product.attributes.description,
            attributes: product.attributes.attributes,
            metaTitle: product.attributes.metaTitle,
            metaKeywords: product.attributes.metaKeywords,
            metaDescription: product.attributes.metaDescription,
            superAttributes: product.attributes.superAttributesDefinition,
            attributeNames: product.attributes.attributeNames,
            attributeMap: product.attributes.attributeMap,
            url: product.attributes.url,
          },
          images: images.map(img => ({
            id: img.id,
            attributes: img.attributes,
          })),
          availability: availability.map(avail => ({
            id: avail.id,
            attributes: avail.attributes,
          })),
          prices: prices.map(price => ({
            id: price.id,
            attributes: price.attributes,
          })),
          categories: categories.map(cat => ({
            id: cat.id,
            attributes: cat.attributes,
          })),
        }, null, 2),
      }],
    };
    
  } catch (error) {
    logger.error('Get product failed', error as Error);
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: 'Failed to retrieve product',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          responseData: error instanceof ApiError ? error.responseData : [],
          sku: args.sku,
        }, null, 2),
      }],
      isError: true,
    };
  }
}

export const getProductTool: SprykerTool = {
  name: 'get-product',
  description: 'Get detailed abstract product information by SKU including attributes, concrete products(to add to cart), images, pricing, and availability.',
  inputSchema: zodToJsonSchema(GetProductSchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = GetProductSchema.parse(args);
    return await getProduct(validatedArgs);
  },
};
