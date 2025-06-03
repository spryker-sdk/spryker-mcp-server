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
import { CallToolRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, SetLevelRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { toolRegistry } from './tools/index.js';
import { promptRegistry } from './prompts/index.js';
import { StdioMCPServer } from './servers/stdio-server.js';
import { HttpMCPServer } from './servers/http-server.js';
import { SSEMCPServer } from './servers/sse-server.js';
/**
 * Create handler registration function for tools and prompts
 */
function createHandlerRegistrar() {
    return (server) => {
        // Register tool call handler
        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            logger.info(`Executing tool: ${name}`, { args });
            try {
                const result = await toolRegistry.callTool(name, args || {});
                logger.info(`Tool ${name} executed successfully`);
                return result;
            }
            catch (error) {
                logger.error(`Tool ${name} execution failed:`, error instanceof Error ? error : new Error(String(error)));
                throw error;
            }
        });
        // Register prompt list handler
        server.setRequestHandler(ListPromptsRequestSchema, async () => {
            logger.debug('Received list_prompts request');
            const prompts = promptRegistry.getMCPPrompts();
            logger.info(`Returning ${prompts.length} available prompts`);
            return { prompts };
        });
        // Register prompt get handler
        server.setRequestHandler(GetPromptRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            logger.info(`Getting prompt: ${name}`, { args });
            try {
                const content = promptRegistry.generatePromptContent(name, args || {});
                logger.info(`Prompt ${name} generated successfully`);
                return {
                    description: promptRegistry.get(name)?.description || '',
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: content,
                            },
                        },
                    ],
                };
            }
            catch (error) {
                logger.error(`Prompt ${name} generation failed:`, error instanceof Error ? error : new Error(String(error)));
                throw error;
            }
        });
        // Register logging set level handler
        server.setRequestHandler(SetLevelRequestSchema, async (request) => {
            const { level } = request.params;
            logger.info(`Setting log level to: ${level}`);
            try {
                const previousLevel = logger.getLevel();
                logger.setLevel(level);
                const newLevel = logger.getLevel();
                logger.info(`Log level successfully changed from ${previousLevel} to ${newLevel}`);
                return {
                    message: `Log level changed from '${previousLevel}' to '${newLevel}'`,
                    previousLevel: previousLevel,
                    newLevel: newLevel,
                    requestedLevel: level,
                    timestamp: new Date().toISOString()
                };
            }
            catch (error) {
                logger.error(`Failed to set log level to ${level}:`, error instanceof Error ? error : new Error(String(error)));
                throw error;
            }
        });
        // Register all tools (this will handle ListToolsRequestSchema)
        toolRegistry.registerAll(server);
    };
}
/**
 * Create the appropriate server implementation based on transport type
 */
function createServer(options) {
    const registerHandlers = createHandlerRegistrar();
    switch (options.transport) {
        case 'stdio':
            return new StdioMCPServer(options, registerHandlers);
        case 'http':
            return new HttpMCPServer(options, registerHandlers);
        case 'sse':
            return new SSEMCPServer(options, registerHandlers);
        default:
            throw new Error(`Unsupported transport type: ${options.transport}`);
    }
}
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        transport: config.mcp.transport || 'stdio'
    };
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--transport':
                const transport = args[++i];
                if (['stdio', 'http', 'sse'].includes(transport)) {
                    options.transport = transport;
                }
                else {
                    logger.error(`Invalid transport: ${transport}. Valid options: stdio, http, sse`);
                    process.exit(1);
                }
                break;
            case '--port':
                const portStr = args[++i];
                if (!portStr) {
                    logger.error('Port number required');
                    process.exit(1);
                }
                options.httpPort = parseInt(portStr, 10);
                if (isNaN(options.httpPort)) {
                    logger.error('Invalid port number');
                    process.exit(1);
                }
                break;
            case '--host':
                const host = args[++i];
                if (!host) {
                    logger.error('Host required');
                    process.exit(1);
                }
                options.httpHost = host;
                break;
            case '--endpoint':
                const endpoint = args[++i];
                if (!endpoint) {
                    logger.error('Endpoint required');
                    process.exit(1);
                }
                options.httpEndpoint = endpoint;
                break;
            case '--help':
                console.error(`
Spryker MCP Server

Usage: spryker-mcp-server [options]

Options:
  --transport <type>    Transport type: stdio, http, or sse (default: ${config.mcp.transport})
  --port <number>       HTTP port for http/sse transport (default: ${config.mcp.http.port})
  --host <string>       HTTP host for http/sse transport (default: ${config.mcp.http.host})
  --endpoint <string>   HTTP endpoint path (default: ${config.mcp.http.endpoint})
  --help               Show this help message

Examples:
  spryker-mcp-server                           # Use stdio transport
  spryker-mcp-server --transport http --port 3000
  spryker-mcp-server --transport sse --port 8080 --host 0.0.0.0

Environment Variables:
  SPRYKER_API_BASE_URL - Spryker API base URL
  MCP_TRANSPORT        - Transport type (stdio|http|sse)
  MCP_HTTP_PORT        - HTTP port
  MCP_HTTP_HOST        - HTTP host
  MCP_HTTP_ENDPOINT    - HTTP endpoint path
        `);
                process.exit(0);
                break;
        }
    }
    return options;
}
/**
 * Application entry point
 */
async function main() {
    const options = parseArgs();
    const server = createServer(options);
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await server.shutdown();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        await server.shutdown();
        process.exit(0);
    });
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught exception:', error);
        server.shutdown().finally(() => {
            process.exit(1);
        });
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled rejection:', {
            reason: reason instanceof Error ? {
                message: reason.message,
                stack: reason.stack,
                name: reason.name
            } : String(reason),
            promise: promise.toString()
        });
        // Don't shut down the server for unhandled rejections
        // Just log them and continue running for better stability
        // The server should only shut down on critical errors or signals
    });
    // Start the server
    await server.start();
}
// Export for testing, but auto-start when run directly
export { main, createServer, createHandlerRegistrar };
// Auto-start when run as main module
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
    main().catch((error) => {
        logger.error('Failed to start server:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map