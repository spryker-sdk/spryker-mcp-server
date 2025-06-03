/**
 * Tool registration and management
 *
 * Central registry for all MCP tools with proper type safety,
 * error handling, and consistent response formatting.
 * Based on patterns from the MCP everything server.
 */
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
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
/**
 * Tool registry class for managing MCP tools
 */
export class ToolRegistry {
    tools = new Map();
    /**
     * Register a single tool
     */
    registerTool(tool) {
        if (this.tools.has(tool.name)) {
            logger.warn(`Tool ${tool.name} is already registered, overwriting`);
        }
        this.tools.set(tool.name, tool);
        logger.debug(`Registered tool: ${tool.name}`);
    }
    /**
     * Get all registered tools
     */
    getTools() {
        return Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
        }));
    }
    /**
     * Get a specific tool by name
     */
    getTool(name) {
        return this.tools.get(name);
    }
    /**
     * Execute a tool with error handling and logging
     */
    async callTool(name, args) {
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
    registerAll(server) {
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
        ];
        tools.forEach(tool => this.registerTool(tool));
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
//# sourceMappingURL=index.js.map