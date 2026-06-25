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
const MARKETPLACE_AVAILABILITY = { marketplace: true };
function errorResponse(action, error, extra = {}) {
    return {
        content: [{
                type: 'text',
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
async function getMerchants(_args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Retrieving merchants');
        const response = await apiService.get('merchants');
        const data = response.data.data;
        const merchants = Array.isArray(data) ? data : data ? [data] : [];
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: response.status === 200,
                        message: 'Merchants retrieved successfully',
                        merchants: merchants.map(m => ({ id: m.id, attributes: m.attributes })),
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Get merchants failed', error);
        return errorResponse('retrieve merchants', error);
    }
}
export const getMerchantsTool = {
    name: 'get-merchants',
    description: 'List the merchants available in the marketplace.',
    availability: MARKETPLACE_AVAILABILITY,
    inputSchema: z.toJSONSchema(GetMerchantsSchema),
    handler: async (args) => getMerchants(GetMerchantsSchema.parse(args)),
};
// --- Get merchant ---
const GetMerchantSchema = z.object({
    merchantReference: z.string().describe('Merchant reference to retrieve'),
});
async function getMerchant(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Retrieving merchant', { merchantReference: args.merchantReference });
        const response = await apiService.get(`merchants/${args.merchantReference}?include=merchant-addresses,merchant-opening-hours`);
        const merchant = response.data.data;
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: response.status === 200,
                        message: 'Merchant retrieved successfully',
                        merchant: { id: merchant.id, attributes: merchant.attributes },
                        included: (response.data.included || []).map(i => ({ type: i.type, id: i.id, attributes: i.attributes })),
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Get merchant failed', error);
        return errorResponse('retrieve merchant', error, { merchantReference: args.merchantReference });
    }
}
export const getMerchantTool = {
    name: 'get-merchant',
    description: 'Get a marketplace merchant by reference, including profile details.',
    availability: MARKETPLACE_AVAILABILITY,
    inputSchema: z.toJSONSchema(GetMerchantSchema),
    handler: async (args) => getMerchant(GetMerchantSchema.parse(args)),
};
// --- Get product offers ---
const GetProductOffersSchema = z.object({
    sku: z.string().describe('Concrete product SKU to list seller offers for'),
});
async function getProductOffers(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Retrieving product offers', { sku: args.sku });
        const response = await apiService.get(`concrete-products/${args.sku}/product-offers`);
        const data = response.data.data;
        const offers = Array.isArray(data) ? data : data ? [data] : [];
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: response.status === 200,
                        message: 'Product offers retrieved successfully',
                        sku: args.sku,
                        offers: offers.map(o => ({ id: o.id, attributes: o.attributes })),
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Get product offers failed', error);
        return errorResponse('retrieve product offers', error, { sku: args.sku });
    }
}
export const getProductOffersTool = {
    name: 'get-product-offers',
    description: 'List the seller offers (from different merchants) for a concrete product SKU.',
    availability: MARKETPLACE_AVAILABILITY,
    inputSchema: z.toJSONSchema(GetProductOffersSchema),
    handler: async (args) => getProductOffers(GetProductOffersSchema.parse(args)),
};
//# sourceMappingURL=marketplace.js.map