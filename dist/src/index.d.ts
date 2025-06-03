#!/usr/bin/env node
/**
 * Spryker MCP Server
 *
 * A Model Context Protocol (MCP) server that provides integration with Spryker e-commerce platform.
 * This server exposes Spryker's API functionality through MCP tools, enabling AI assistants
 * to interact with products, carts, orders, and customer data.
 *
 * Features:
 * - Product search and management
 * - Shopping cart operations
 * - Order processing and checkout
 * - Customer authentication
 * - Guest user support
 */
import { ServerOptions, MCPServer, HandlerRegistrar } from './servers/types.js';
/**
 * Create handler registration function for tools and prompts
 */
declare function createHandlerRegistrar(): HandlerRegistrar;
/**
 * Create the appropriate server implementation based on transport type
 */
declare function createServer(options: ServerOptions): MCPServer;
/**
 * Application entry point
 */
declare function main(): Promise<void>;
export { main, createServer, createHandlerRegistrar };
//# sourceMappingURL=index.d.ts.map