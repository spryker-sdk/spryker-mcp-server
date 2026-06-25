/**
 * Marketplace Tools
 *
 * Merchant and product-offer access for marketplace deployments. Tagged with
 * the marketplace capability, so they are only exposed when marketplace is
 * enabled (overlaying either B2C or B2B).
 */

import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool, ToolAvailability } from './types.js';

const MARKETPLACE_AVAILABILITY: ToolAvailability = { marketplace: true };

function errorResponse(action: string, error: unknown, extra: Record<string, unknown> = {}) {
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: false,
        error: `Failed to ${action}`,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        responseData: error instanceof ApiError ? error.responseData : [],
        ...extra,
      }, null, 2),
    }],
    isError: true,
  };
}

// --- Get merchants ---

const GetMerchantsSchema = z.object({});

async function getMerchants(_args: z.infer<typeof GetMerchantsSchema>) {
  const apiService = SprykerApiService.getInstance();
  try {
    logger.info('Retrieving merchants');
    const response = await apiService.get<{
      data: Array<{ type: string; id: string; attributes: Record<string, unknown> }>;
    }>('merchants');
    const data = response.data.data;
    const merchants = Array.isArray(data) ? data : data ? [data] : [];
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: response.status === 200,
          message: 'Merchants retrieved successfully',
          merchants: merchants.map(m => ({ id: m.id, attributes: m.attributes })),
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Get merchants failed', error as Error);
    return errorResponse('retrieve merchants', error);
  }
}

export const getMerchantsTool: SprykerTool = {
  name: 'get-merchants',
  description: 'List the merchants available in the marketplace.',
  availability: MARKETPLACE_AVAILABILITY,
  inputSchema: z.toJSONSchema(GetMerchantsSchema) as any,
  handler: async (args: Record<string, unknown>) => getMerchants(GetMerchantsSchema.parse(args)),
};

// --- Get merchant ---

const GetMerchantSchema = z.object({
  merchantReference: z.string().describe('Merchant reference to retrieve'),
});

async function getMerchant(args: z.infer<typeof GetMerchantSchema>) {
  const apiService = SprykerApiService.getInstance();
  try {
    logger.info('Retrieving merchant', { merchantReference: args.merchantReference });
    const response = await apiService.get<{
      data: { type: string; id: string; attributes: Record<string, unknown> };
      included?: Array<{ type: string; id: string; attributes: unknown }>;
    }>(`merchants/${args.merchantReference}?include=merchant-addresses,merchant-opening-hours`);
    const merchant = response.data.data;
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: response.status === 200,
          message: 'Merchant retrieved successfully',
          merchant: { id: merchant.id, attributes: merchant.attributes },
          included: (response.data.included || []).map(i => ({ type: i.type, id: i.id, attributes: i.attributes })),
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Get merchant failed', error as Error);
    return errorResponse('retrieve merchant', error, { merchantReference: args.merchantReference });
  }
}

export const getMerchantTool: SprykerTool = {
  name: 'get-merchant',
  description: 'Get a marketplace merchant by reference, including profile details.',
  availability: MARKETPLACE_AVAILABILITY,
  inputSchema: z.toJSONSchema(GetMerchantSchema) as any,
  handler: async (args: Record<string, unknown>) => getMerchant(GetMerchantSchema.parse(args)),
};

// --- Get product offers ---

const GetProductOffersSchema = z.object({
  sku: z.string().describe('Concrete product SKU to list seller offers for'),
});

async function getProductOffers(args: z.infer<typeof GetProductOffersSchema>) {
  const apiService = SprykerApiService.getInstance();
  try {
    logger.info('Retrieving product offers', { sku: args.sku });
    const response = await apiService.get<{
      data: Array<{ type: string; id: string; attributes: Record<string, unknown> }>;
    }>(`concrete-products/${args.sku}/product-offers`);
    const data = response.data.data;
    const offers = Array.isArray(data) ? data : data ? [data] : [];
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: response.status === 200,
          message: 'Product offers retrieved successfully',
          sku: args.sku,
          offers: offers.map(o => ({ id: o.id, attributes: o.attributes })),
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Get product offers failed', error as Error);
    return errorResponse('retrieve product offers', error, { sku: args.sku });
  }
}

export const getProductOffersTool: SprykerTool = {
  name: 'get-product-offers',
  description: 'List the seller offers (from different merchants) for a concrete product SKU.',
  availability: MARKETPLACE_AVAILABILITY,
  inputSchema: z.toJSONSchema(GetProductOffersSchema) as any,
  handler: async (args: Record<string, unknown>) => getProductOffers(GetProductOffersSchema.parse(args)),
};
