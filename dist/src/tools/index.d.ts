/**
 * Tool registration and management
 *
 * Central registry for all MCP tools with proper type safety,
 * error handling, and consistent response formatting.
 * Based on patterns from the MCP everything server.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SprykerTool } from './types.js';
/**
 * Tool registry class for managing MCP tools
 */
export declare class ToolRegistry {
    private tools;
    /**
     * Register a single tool
     */
    registerTool(tool: SprykerTool): void;
    /**
     * Get all registered tools
     */
    getTools(): Tool[];
    /**
     * Get a specific tool by name
     */
    getTool(name: string): SprykerTool | undefined;
    /**
     * Execute a tool with error handling and logging
     */
    callTool(name: string, args: Record<string, unknown>): Promise<{
        content: Array<{
            type: "text";
            text: string;
        }>;
    }>;
    /**
     * Register all tools with the MCP server
     */
    registerAll(server: Server): void;
}
/**
 * Global tool registry instance
 */
export declare const toolRegistry: ToolRegistry;
//# sourceMappingURL=index.d.ts.map