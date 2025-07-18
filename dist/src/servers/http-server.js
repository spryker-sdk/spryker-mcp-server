/**
 * HTTP MCP Server Implementation
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from 'node:http';
import { URL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { validateEnvironment } from '../utils/validation.js';
export class HttpMCPServer {
    httpServer = null;
    options;
    registerHandlers;
    transports = new Map();
    constructor(options, registerHandlers) {
        this.options = {
            transport: options.transport,
            httpPort: options.httpPort || config.mcp.http.port,
            httpHost: options.httpHost || config.mcp.http.host,
            httpEndpoint: options.httpEndpoint || config.mcp.http.endpoint,
        };
        this.registerHandlers = registerHandlers;
    }
    async start() {
        logger.info('Starting Spryker MCP Server (HTTP)...');
        logger.info(`Transport: ${this.options.transport}`);
        try {
            // Validate environment configuration
            validateEnvironment();
            // Initialize HTTP server
            await this.initializeHttpServer();
            logger.info(`Spryker MCP Server started successfully`);
            logger.info(`Server Name: ${config.server.name}`);
            logger.info(`Server Version: ${config.server.version}`);
            logger.info(`API Base URL: ${config.api.baseUrl}`);
            logger.info(`HTTP Server: http://${this.options.httpHost}:${this.options.httpPort}`);
            logger.info(`MCP Endpoint: ${this.options.httpEndpoint}`);
        }
        catch (error) {
            logger.error('Failed to start HTTP server:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }
    async initializeHttpServer() {
        return new Promise((resolve, reject) => {
            this.httpServer = createServer((req, res) => {
                // Wrap the handler in a try-catch to prevent unhandled promise rejections
                this.handleHttpRequest(req, res).catch((error) => {
                    logger.error('HTTP request handler error:', error instanceof Error ? error : new Error(String(error)));
                    // Only send error response if headers haven't been sent
                    if (!res.headersSent) {
                        try {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({
                                error: 'Internal server error',
                                message: error instanceof Error ? error.message : 'Unknown error'
                            }));
                        }
                        catch (responseError) {
                            logger.error('Failed to send error response:', responseError instanceof Error ? responseError : new Error(String(responseError)));
                        }
                    }
                });
            });
            this.httpServer.listen(this.options.httpPort, this.options.httpHost, () => {
                logger.info(`HTTP server listening on ${this.options.httpHost}:${this.options.httpPort}`);
                logger.info(`MCP endpoint available at: http://${this.options.httpHost}:${this.options.httpPort}${this.options.httpEndpoint}`);
                resolve();
            });
            this.httpServer.on('error', (error) => {
                logger.error('HTTP server error:', error);
                reject(error);
            });
        });
    }
    async handleHttpRequest(req, res) {
        try {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-protocol-version, mcp-session-id');
            res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            const url = new URL(req.url || '/', `http://${req.headers.host}`);
            if (url.pathname === this.options.httpEndpoint) {
                if (req.method === 'POST') {
                    // Handle MCP JSON-RPC messages via POST
                    try {
                        let body = '';
                        req.on('data', chunk => body += chunk.toString());
                        req.on('end', async () => {
                            try {
                                const message = JSON.parse(body);
                                logger.debug('Received MCP message via POST:', message);
                                // Handle MCP requests using StreamableHTTPServerTransport
                                await this.handleMCPRequest(req, res, message);
                            }
                            catch (parseError) {
                                logger.error('Failed to parse POST body:', parseError instanceof Error ? parseError : new Error(String(parseError)));
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    jsonrpc: '2.0',
                                    error: {
                                        code: -32700,
                                        message: 'Parse error: Invalid JSON'
                                    },
                                    id: null
                                }));
                            }
                        });
                    }
                    catch (postError) {
                        logger.error('POST request handling failed:', postError instanceof Error ? postError : new Error(String(postError)));
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            jsonrpc: '2.0',
                            error: {
                                code: -32603,
                                message: 'Internal error'
                            },
                            id: null
                        }));
                    }
                }
                else if (req.method === 'GET') {
                    // For GET requests, provide information about the MCP endpoint
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        message: 'MCP server is running',
                        transport: this.options.transport,
                        endpoint: this.options.httpEndpoint,
                        instructions: 'Send JSON-RPC requests via POST'
                    }));
                }
                else {
                    res.writeHead(405, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        jsonrpc: '2.0',
                        error: {
                            code: -32000,
                            message: 'Method not allowed'
                        },
                        id: null
                    }));
                }
            }
            else if (url.pathname === '/health') {
                // Health check endpoint
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'healthy',
                    transport: this.options.transport,
                    timestamp: new Date().toISOString()
                }));
            }
            else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    jsonrpc: '2.0',
                    error: {
                        code: -32000,
                        message: 'Not found'
                    },
                    id: null
                }));
            }
        }
        catch (error) {
            logger.error('Request handling error:', error instanceof Error ? error : new Error(String(error)));
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal error'
                    },
                    id: null
                }));
            }
        }
    }
    async handleMCPRequest(req, res, message) {
        try {
            // Check for existing session ID in headers
            const sessionId = req.headers['mcp-session-id'];
            let transport;
            if (sessionId && this.transports.has(sessionId)) {
                // Reuse existing transport
                transport = this.transports.get(sessionId);
                logger.debug(`Reusing transport for session: ${sessionId}`);
            }
            else if (!sessionId && isInitializeRequest(message)) {
                // New initialization request - create new transport with JSON response mode
                logger.info('Creating new MCP transport for initialization request');
                transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => randomUUID(),
                    enableJsonResponse: true, // Enable JSON response mode for HTTP
                    onsessioninitialized: (newSessionId) => {
                        logger.info(`MCP session initialized with ID: ${newSessionId}`);
                        this.transports.set(newSessionId, transport);
                    }
                });
                // Create a new server instance for this session
                const server = new Server({
                    name: config.server.name,
                    version: config.server.version,
                }, {
                    capabilities: {
                        tools: {},
                        prompts: {},
                        logging: {},
                    },
                });
                // Register all handlers for this server instance
                this.registerHandlers(server);
                // Connect the transport to the server BEFORE handling the request
                await server.connect(transport);
                // Handle the initialization request
                // For VS Code compatibility, we need to handle the Accept header issue
                // VS Code might not send the required "application/json, text/event-stream"
                const originalAccept = req.headers.accept;
                if (!originalAccept || !originalAccept.includes('text/event-stream')) {
                    // Temporarily modify the Accept header for VS Code compatibility
                    req.headers.accept = 'application/json, text/event-stream';
                    logger.debug('Modified Accept header for VS Code compatibility');
                }
                await transport.handleRequest(req, res, message);
                // Restore original header
                req.headers.accept = originalAccept;
                return;
            }
            else {
                // Invalid request - no session ID for non-initialization request
                logger.warn('Received non-initialization request without session ID');
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    jsonrpc: '2.0',
                    error: {
                        code: -32000,
                        message: 'Bad Request: Missing session ID for non-initialization request',
                    },
                    id: message.id || null,
                }));
                return;
            }
            // Handle the request with existing transport
            // For VS Code compatibility, ensure proper Accept header
            const originalAccept = req.headers.accept;
            if (!originalAccept || !originalAccept.includes('text/event-stream')) {
                req.headers.accept = 'application/json, text/event-stream';
                logger.debug('Modified Accept header for existing session VS Code compatibility');
            }
            await transport.handleRequest(req, res, message);
            // Restore original header
            req.headers.accept = originalAccept;
        }
        catch (error) {
            logger.error('MCP request handling error:', error instanceof Error ? error : new Error(String(error)));
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal server error',
                    },
                    id: message?.id || null,
                }));
            }
        }
    }
    async shutdown() {
        logger.info('Shutting down HTTP MCP Server...');
        try {
            // Close all active transports
            for (const [sessionId, transport] of this.transports) {
                try {
                    await transport.close();
                    logger.debug(`Closed transport for session: ${sessionId}`);
                }
                catch (error) {
                    logger.error(`Error closing transport for session ${sessionId}:`, error instanceof Error ? error : new Error(String(error)));
                }
            }
            this.transports.clear();
            // Close HTTP server if it exists
            if (this.httpServer) {
                await new Promise((resolve, reject) => {
                    this.httpServer.close((error) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve();
                        }
                    });
                });
                logger.info('HTTP server stopped');
            }
            logger.info('HTTP server shutdown complete');
        }
        catch (error) {
            logger.error('Error during HTTP server shutdown:', error instanceof Error ? error : new Error(String(error)));
        }
    }
}
//# sourceMappingURL=http-server.js.map