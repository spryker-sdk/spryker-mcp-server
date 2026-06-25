/**
 * B2B Shopping List Tools
 *
 * Shopping lists are the B2B counterpart to B2C wishlists. All require an
 * authenticated B2B company-user token and are only exposed in the B2B model.
 */

import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool, ToolAvailability } from './types.js';

const B2B_AVAILABILITY: ToolAvailability = { models: ['b2b'] };

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

// --- Get shopping lists ---

const GetShoppingListsSchema = z.object({
  token: z.string().describe('B2B customer access token'),
  shoppingListUuid: z
    .string()
    .optional()
    .describe('Specific shopping list UUID to retrieve with its items. If omitted, all lists are returned.'),
});

async function getShoppingLists(args: z.infer<typeof GetShoppingListsSchema>) {
  const apiService = SprykerApiService.getInstance();
  try {
    logger.info('Retrieving shopping lists', { shoppingListUuid: args.shoppingListUuid || 'all' });
    const endpoint = args.shoppingListUuid
      ? `shopping-lists/${args.shoppingListUuid}?include=shopping-list-items`
      : 'shopping-lists';
    const response = await apiService.get<{
      data: Array<{ type: string; id: string; attributes: Record<string, unknown> }> | {
        type: string; id: string; attributes: Record<string, unknown>;
      };
      included?: Array<{ type: string; id: string; attributes: unknown }>;
    }>(endpoint, args.token);

    const data = response.data.data;
    const lists = Array.isArray(data) ? data : data ? [data] : [];
    const items = (response.data.included || []).filter(item => item.type === 'shopping-list-items');

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: response.status === 200,
          message: 'Shopping lists retrieved successfully',
          shoppingLists: lists.map(l => ({ id: l.id, attributes: l.attributes })),
          items: items.map(i => ({ id: i.id, attributes: i.attributes })),
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Get shopping lists failed', error as Error);
    return errorResponse('retrieve shopping lists', error);
  }
}

export const getShoppingListsTool: SprykerTool = {
  name: 'get-shopping-lists',
  description: 'Get a B2B customer\'s shopping lists, or a single list with its items when a UUID is given.',
  availability: B2B_AVAILABILITY,
  inputSchema: z.toJSONSchema(GetShoppingListsSchema) as any,
  handler: async (args: Record<string, unknown>) => getShoppingLists(GetShoppingListsSchema.parse(args)),
};

// --- Create shopping list ---

const CreateShoppingListSchema = z.object({
  token: z.string().describe('B2B customer access token'),
  name: z.string().describe('Name of the new shopping list'),
});

async function createShoppingList(args: z.infer<typeof CreateShoppingListSchema>) {
  const apiService = SprykerApiService.getInstance();
  try {
    logger.info('Creating shopping list', { name: args.name });
    const response = await apiService.post(
      'shopping-lists',
      { data: { type: 'shopping-lists', attributes: { name: args.name } } },
      args.token
    );
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: 'Shopping list created successfully',
          shoppingList: response.data,
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Create shopping list failed', error as Error);
    return errorResponse('create shopping list', error, { name: args.name });
  }
}

export const createShoppingListTool: SprykerTool = {
  name: 'create-shopping-list',
  description: 'Create a new shopping list for a B2B customer.',
  availability: B2B_AVAILABILITY,
  inputSchema: z.toJSONSchema(CreateShoppingListSchema) as any,
  handler: async (args: Record<string, unknown>) => createShoppingList(CreateShoppingListSchema.parse(args)),
};

// --- Add item to shopping list ---

const AddToShoppingListSchema = z.object({
  token: z.string().describe('B2B customer access token'),
  shoppingListUuid: z.string().describe('UUID of the shopping list to add the item to'),
  sku: z.string().describe('Concrete product SKU to add'),
  quantity: z.number().min(1).default(1).describe('Quantity to add'),
});

async function addToShoppingList(args: z.infer<typeof AddToShoppingListSchema>) {
  const apiService = SprykerApiService.getInstance();
  try {
    logger.info('Adding item to shopping list', { shoppingListUuid: args.shoppingListUuid, sku: args.sku });
    const response = await apiService.post(
      `shopping-lists/${args.shoppingListUuid}/shopping-list-items`,
      { data: { type: 'shopping-list-items', attributes: { sku: args.sku, quantity: args.quantity } } },
      args.token
    );
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: 'Item added to shopping list successfully',
          shoppingListUuid: args.shoppingListUuid,
          sku: args.sku,
          item: response.data,
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Add to shopping list failed', error as Error);
    return errorResponse('add item to shopping list', error, { shoppingListUuid: args.shoppingListUuid, sku: args.sku });
  }
}

export const addToShoppingListTool: SprykerTool = {
  name: 'add-to-shopping-list',
  description: 'Add a concrete product to a B2B shopping list.',
  availability: B2B_AVAILABILITY,
  inputSchema: z.toJSONSchema(AddToShoppingListSchema) as any,
  handler: async (args: Record<string, unknown>) => addToShoppingList(AddToShoppingListSchema.parse(args)),
};

// --- Shopping list to cart ---

const ShoppingListToCartSchema = z.object({
  token: z.string().describe('B2B customer access token'),
  shoppingListUuid: z.string().describe('UUID of the shopping list to copy items from'),
  cartId: z.string().describe('ID of the cart to add the items to'),
});

async function shoppingListToCart(args: z.infer<typeof ShoppingListToCartSchema>) {
  const apiService = SprykerApiService.getInstance();
  try {
    logger.info('Moving shopping list items to cart', { shoppingListUuid: args.shoppingListUuid, cartId: args.cartId });
    const listResponse = await apiService.get<{
      included?: Array<{ type: string; id: string; attributes: { sku?: string; quantity?: number } }>;
    }>(`shopping-lists/${args.shoppingListUuid}?include=shopping-list-items`, args.token);

    const items = (listResponse.data.included || []).filter(item => item.type === 'shopping-list-items');
    const added: string[] = [];
    const failed: Array<{ sku: string; message: string }> = [];

    for (const item of items) {
      const sku = item.attributes?.sku;
      if (!sku) { continue; }
      try {
        await apiService.post(
          `carts/${args.cartId}/items`,
          { data: { type: 'items', attributes: { sku, quantity: item.attributes?.quantity ?? 1 } } },
          args.token
        );
        added.push(sku);
      } catch (itemError) {
        failed.push({ sku, message: itemError instanceof Error ? itemError.message : 'Unknown error occurred' });
      }
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: failed.length === 0,
          message: `Added ${added.length} of ${items.length} shopping list items to the cart`,
          shoppingListUuid: args.shoppingListUuid,
          cartId: args.cartId,
          added,
          failed,
        }, null, 2),
      }],
      ...(failed.length > 0 ? { isError: true } : {}),
    };
  } catch (error) {
    logger.error('Shopping list to cart failed', error as Error);
    return errorResponse('move shopping list items to cart', error, { shoppingListUuid: args.shoppingListUuid, cartId: args.cartId });
  }
}

export const shoppingListToCartTool: SprykerTool = {
  name: 'shopping-list-to-cart',
  description: 'Move all items from a B2B shopping list into a cart.',
  availability: B2B_AVAILABILITY,
  inputSchema: z.toJSONSchema(ShoppingListToCartSchema) as any,
  handler: async (args: Record<string, unknown>) => shoppingListToCart(ShoppingListToCartSchema.parse(args)),
};
