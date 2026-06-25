/**
 * Tool registration and management
 * 
 * Central registry for all MCP tools with proper type safety,
 * error handling, and consistent response formatting.
 * Based on patterns from the MCP everything server.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

// Import tool implementations
import { productSearchTool } from './product-search.js';
import { addToCartTool } from './add-to-cart.js';
import { guestAddToCartTool } from './guest-add-to-cart.js';
import { getCartTool } from './get-cart.js';
import { checkoutTool } from './checkout.js';
import { authenticateTool } from './authenticate.js';
import { getProductTool } from './get-product.js';
import { removeFromCartTool } from './remove-from-cart.js';
import { updateCartItemTool } from './update-cart-item.js';
import { getOrderTool } from './get-order.js';
import { getCheckoutDataTool } from './get-checkout-data.js';
import { getConcreteProductTool } from './get-concrete-product.js';
import { getProductAvailabilityTool } from './get-product-availability.js';
import { getProductPricesTool } from './get-product-prices.js';
import { getProductReviewsTool } from './get-product-reviews.js';
import { getCategoryTreeTool } from './get-category-tree.js';
import { getCategoryTool } from './get-category.js';
import { searchSuggestionsTool } from './search-suggestions.js';
import { addCartVoucherTool } from './add-cart-voucher.js';
import { removeCartVoucherTool } from './remove-cart-voucher.js';
import { getWishlistsTool } from './get-wishlists.js';
import { createWishlistTool } from './create-wishlist.js';
import { addToWishlistTool } from './add-to-wishlist.js';
import { wishlistToCartTool } from './wishlist-to-cart.js';
import { registerCustomerTool } from './register-customer.js';
import { refreshTokenTool } from './refresh-token.js';
import {
  getAddressesTool,
  addAddressTool,
  updateAddressTool,
  deleteAddressTool,
} from './customer-addresses.js';
import {
  getCompanyUsersTool,
  getBusinessUnitsTool,
  getCompanyRolesTool,
  getCompanyTool,
} from './b2b-company.js';
import {
  getShoppingListsTool,
  createShoppingListTool,
  addToShoppingListTool,
  shoppingListToCartTool,
} from './b2b-shopping-lists.js';
import {
  getMerchantsTool,
  getMerchantTool,
  getProductOffersTool,
} from './marketplace.js';

import { SprykerTool, isToolAvailable } from './types.js';

/**
 * Tool registry class for managing MCP tools
 */
export class ToolRegistry {
  private tools: Map<string, SprykerTool> = new Map();

  /**
   * Register a single tool
   */
  registerTool(tool: SprykerTool): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`Tool ${tool.name} is already registered, overwriting`);
    }
    
    this.tools.set(tool.name, tool);
    logger.debug(`Registered tool: ${tool.name}`);
  }

  /**
   * Get all registered tools
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  /**
   * Get a specific tool by name
   */
  getTool(name: string): SprykerTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute a tool with error handling and logging
   */
  async callTool(name: string, args: Record<string, unknown>) {
    const tool = this.getTool(name);
    
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    
    logger.debug(`Executing tool: ${name}`, { args });
    
    const startTime = Date.now();
    const result = await tool.handler(args);
    const duration = Date.now() - startTime;
    
    logger.info(`Tool ${name} executed successfully`, { duration });
    return result;
  }

  /**
   * Register all tools with the MCP server
   */
  registerAll(server: Server): void {
    logger.info('Registering MCP tools...');
    
    // Register individual tools
    const tools = [
      productSearchTool,
      addToCartTool,
      guestAddToCartTool,
      getCartTool,
      checkoutTool,
      authenticateTool,
      getProductTool,
      removeFromCartTool,
      updateCartItemTool,
      getOrderTool,
      getCheckoutDataTool,
      getConcreteProductTool,
      getProductAvailabilityTool,
      getProductPricesTool,
      getProductReviewsTool,
      getCategoryTreeTool,
      getCategoryTool,
      searchSuggestionsTool,
      addCartVoucherTool,
      removeCartVoucherTool,
      getWishlistsTool,
      createWishlistTool,
      addToWishlistTool,
      wishlistToCartTool,
      registerCustomerTool,
      refreshTokenTool,
      getAddressesTool,
      addAddressTool,
      updateAddressTool,
      deleteAddressTool,
      // B2B — company & users
      getCompanyUsersTool,
      getBusinessUnitsTool,
      getCompanyRolesTool,
      getCompanyTool,
      // B2B — shopping lists
      getShoppingListsTool,
      createShoppingListTool,
      addToShoppingListTool,
      shoppingListToCartTool,
      // Marketplace — merchants & offers
      getMerchantsTool,
      getMerchantTool,
      getProductOffersTool,
    ];

    // Filter tools by the configured business model / marketplace capability.
    const ctx = {
      businessModel: config.commerce.businessModel,
      marketplaceEnabled: config.commerce.marketplaceEnabled,
    };
    const enabledTools = tools.filter(tool => isToolAvailable(tool, ctx));
    const skipped = tools.length - enabledTools.length;

    enabledTools.forEach(tool => this.registerTool(tool));
    logger.info(
      `Business model '${ctx.businessModel}' (marketplace: ${ctx.marketplaceEnabled}): ` +
      `exposing ${enabledTools.length} of ${tools.length} tools (${skipped} hidden)`
    );
    
    // Set up MCP server handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.getTools();
      logger.debug(`Returning ${tools.length} tools`);
      return { tools };
    });
    
    logger.info(`Successfully registered ${this.tools.size} tools`);
  }
}

/**
 * Global tool registry instance
 */
export const toolRegistry = new ToolRegistry();
