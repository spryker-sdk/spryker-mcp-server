/**
 * Get Order Tool
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {ApiError, SprykerApiService} from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

const GetOrderSchema = z.object({
  token: z.string().describe('Customer access token'),
  orderReference: z.string().optional().describe('Specific order reference to retrieve. If not provided, returns all orders'),
});

async function getOrder(args: z.infer<typeof GetOrderSchema>) {
  const apiService = SprykerApiService.getInstance();
  
  try {
    logger.info('Retrieving order(s)', { 
      orderReference: args.orderReference || 'all orders' 
    });
    
    // Build endpoint URL
    const endpoint = args.orderReference 
      ? `orders/${args.orderReference}?include=order-items,product-concrete`
      : 'orders?include=order-items,product-concrete';
    
    // Get order(s) with included data
    const response = await apiService.get<{
      data: Array<{
        type: string;
        id: string;
        attributes: {
          orderReference: string;
          createdAt: string;
          totals: {
            expenseTotal: number;
            discountTotal: number;
            taxTotal: number;
            subtotal: number;
            grandTotal: number;
          };
          billingAddress: Record<string, unknown>;
          shippingAddress: Record<string, unknown>;
          items: Array<Record<string, unknown>>;
        };
        relationships?: Record<string, unknown>;
      }> | {
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
    }>(endpoint, args.token);

    const orders = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
    const included = response.data.included || [];

    if (orders.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: 'No orders found',
            orders: [],
          }, null, 2),
        }],
      };
    }

    // Process orders with included data
    const processedOrders = orders.map(order => {
      const orderRelationships = order.relationships as Record<string, any> | undefined;
      const orderItems = included.filter(item => {
        if (item.type !== 'order-items') {return false;}
        if (!orderRelationships?.['order-items']?.data) {return false;}
        const relationshipData = orderRelationships['order-items'].data;
        if (!Array.isArray(relationshipData)) {return false;}
        return relationshipData.some((rel: any) => rel.id === item.id);
      });
      
      const products = included.filter(item => 
        item.type === 'product-concrete'
      );

      return {
        orderReference: order.attributes.orderReference,
        createdAt: order.attributes.createdAt,
        totals: order.attributes.totals,
        billingAddress: order.attributes.billingAddress,
        shippingAddress: order.attributes.shippingAddress,
        items: orderItems.map(item => ({
          ...item.attributes,
          product: products.find(p => p.id === item.attributes.sku),
        })),
      };
    });

    if (args.orderReference) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            order: processedOrders[0],
          }, null, 2),
        }],
      };
    } else {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            orders: processedOrders,
            totalOrders: processedOrders.length,
          }, null, 2),
        }],
      };
    }
    
  } catch (error) {
    logger.error('Failed to retrieve order(s)', error as Error);
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: 'Failed to retrieve order(s)',
          message: (error as any)?.message || 'Unknown error occurred',
          responseData: error instanceof ApiError ? error.responseData : []
        }, null, 2),
      }],
      isError: true,
    };
  }
}

export const getOrderTool: SprykerTool = {
  name: 'get-order',
  description: 'Retrieve order details and history',
  inputSchema: zodToJsonSchema(GetOrderSchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = GetOrderSchema.parse(args);
    return await getOrder(validatedArgs);
  },
};
