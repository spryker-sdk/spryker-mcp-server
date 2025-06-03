/**
 * Get Checkout Data Tool
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {ApiError, SprykerApiService} from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

const GetCheckoutDataSchema = z.object({
  token: z.string().describe('Customer access token or guest token'),
  cartId: z.string().describe('ID of the cart to get checkout data for'),
});

async function getCheckoutData(args: z.infer<typeof GetCheckoutDataSchema>) {
  const apiService = SprykerApiService.getInstance();
  
  try {
    logger.info('Retrieving checkout data', { cartId: args.cartId });
    
    // Get checkout data with all related information
    const response = await apiService.post<{
      data: {
        type: string;
        id: string;
        attributes: Record<string, unknown>;
        relationships?: Record<string, unknown>;
      };
      included?: Array<{
        type: string;
        id: string;
        attributes: Record<string, unknown>;
      }>;
    }>('checkout-data?include=payment-methods,shipments,shipment-methods,addresses', {
      data: {
        type: 'checkout-data',
        attributes: {
          idCart: args.cartId,
        },
      },
    }, args.token);

    const checkoutData = response.data.data;
    const included = response.data.included || [];

    // Parse included data to extract different types
    const paymentMethods = included.filter(item => item.type === 'payment-methods');
    const shipmentMethods = included.filter(item => item.type === 'shipment-methods');
    const customerAddresses = included.filter(item => item.type === 'addresses');
    const shipments = included.filter(item => item.type === 'shipments');

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: 'Checkout data retrieved successfully',
          checkoutData: {
            ...checkoutData.attributes,
            id: checkoutData.id,
          },
          paymentMethods: paymentMethods.map(method => ({
            id: method.id,
            ...method.attributes,
          })),
          shipmentMethods: shipmentMethods.map(method => ({
            id: method.id,
            ...method.attributes,
          })),
          customerAddresses: customerAddresses.map(address => ({
            id: address.id,
            ...address.attributes,
          })),
          shipments: shipments.map(shipment => ({
            id: shipment.id,
            ...shipment.attributes,
          })),
          availableData: {
            hasCheckoutData: !!checkoutData,
            paymentMethodsCount: paymentMethods.length,
            shipmentMethodsCount: shipmentMethods.length,
            customerAddressesCount: customerAddresses.length,
            shipmentsCount: shipments.length,
          },
        }, null, 2),
      }],
    };
    
  } catch (error) {
    logger.error('Failed to retrieve checkout data', error as Error);
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: 'Failed to retrieve checkout data',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          responseData: error instanceof ApiError ? error.responseData : []
        }, null, 2),
      }],
      isError: true,
    };
  }
}

export const getCheckoutDataTool: SprykerTool = {
  name: 'get-checkout-data',
  description: 'Get checkout data including payment methods, shipment methods, and customer addresses',
  inputSchema: zodToJsonSchema(GetCheckoutDataSchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = GetCheckoutDataSchema.parse(args);
    return await getCheckoutData(validatedArgs);
  },
};
