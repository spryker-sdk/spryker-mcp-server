/**
 * Stdio MCP Server Implementation
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { validateEnvironment } from '../utils/validation.js';
export class StdioMCPServer {
    server;
    transport = null;
    options;
    registerHandlers;
    constructor(options, registerHandlers) {
        this.options = options;
        this.registerHandlers = registerHandlers;
        this.server = new Server({
            name: config.server.name,
            version: config.server.version,
        }, {
            capabilities: {
                tools: {},
                prompts: {},
                logging: {},
            },
        });
        // Register all handlers
        this.registerHandlers(this.server);
    }
    async start() {
        logger.info('Starting Spryker MCP Server (stdio)...');
        logger.info(`Transport: ${this.options.transport}`);
        try {
            // Validate environment configuration
            validateEnvironment();
            // Initialize stdio transport
            this.transport = new StdioServerTransport();
            logger.info('Initialized stdio transport');
            // Add event listeners to monitor stdio transport health
            process.stdin.on('end', () => {
                logger.info('stdin ended');
            });
            process.stdin.on('close', () => {
                logger.info('stdin closed');
            });
            process.stdout.on('end', () => {
                logger.info('stdout ended');
            });
            process.stdout.on('close', () => {
                logger.info('stdout closed');
            });
            // Connect server to transport
            logger.info('Connecting server to stdio transport...');
            await this.server.connect(this.transport);
            logger.info('Server connected to stdio transport successfully');
            // Add connection event listeners to monitor transport health
            this.server.onclose = () => {
                logger.info('MCP server connection closed');
            };
            this.server.onerror = (error) => {
                logger.error('MCP server connection error:', error);
            };
            logger.info(`Spryker MCP Server started successfully`);
            logger.info(`Server Name: ${config.server.name}`);
            logger.info(`Server Version: ${config.server.version}`);
            logger.info(`API Base URL: ${config.api.baseUrl}`);
            logger.info('Server is ready to accept MCP requests via stdio');
        }
        catch (error) {
            logger.error('Failed to start stdio server:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }
    async shutdown() {
        logger.info('Shutting down Stdio MCP Server...');
        try {
            // Close the MCP server
            await this.server.close();
            logger.info('Stdio server shutdown complete');
        }
        catch (error) {
            logger.error('Error during stdio server shutdown:', error instanceof Error ? error : new Error(String(error)));
        }
    }
}
//# sourceMappingURL=stdio-server.js.map