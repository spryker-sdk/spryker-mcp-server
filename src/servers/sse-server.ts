/**
 * SSE MCP Server Implementation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { validateEnvironment } from '../utils/validation.js';
import { MCPServer, ServerOptions, HandlerRegistrar } from './types.js';

export class SSEMCPServer implements MCPServer {
  private httpServer: any = null;
  private options: ServerOptions;
  private registerHandlers: HandlerRegistrar;

  constructor(options: ServerOptions, registerHandlers: HandlerRegistrar) {
    this.options = {
      transport: options.transport,
      httpPort: options.httpPort || config.mcp.http.port,
      httpHost: options.httpHost || config.mcp.http.host,
      httpEndpoint: options.httpEndpoint || config.mcp.http.endpoint,
    };
    this.registerHandlers = registerHandlers;
  }

  async start(): Promise<void> {
    logger.info('Starting Spryker MCP Server (SSE)...');
    logger.info(`Transport: ${this.options.transport}`);

    try {
      // Validate environment configuration
      validateEnvironment();
      
      // Initialize HTTP server for SSE connections
      await this.initializeHttpServer();
      
      logger.info(`Spryker MCP Server started successfully`);
      logger.info(`Server Name: ${config.server.name}`);
      logger.info(`Server Version: ${config.server.version}`);
      logger.info(`API Base URL: ${config.api.baseUrl}`);
      logger.info(`HTTP Server: http://${this.options.httpHost}:${this.options.httpPort}`);
      logger.info(`MCP Endpoint: ${this.options.httpEndpoint}`);
      
    } catch (error) {
      logger.error('Failed to start SSE server:', 
        error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private async initializeHttpServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
        // Wrap the handler in a try-catch to prevent unhandled promise rejections
        this.handleHttpRequest(req, res).catch((error) => {
          logger.error('HTTP request handler error:', 
            error instanceof Error ? error : new Error(String(error)));
          
          // Only send error response if headers haven't been sent
          if (!res.headersSent) {
            try {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
              }));
            } catch (responseError) {
              logger.error('Failed to send error response:', 
                responseError instanceof Error ? responseError : new Error(String(responseError)));
            }
          }
        });
      });

      this.httpServer.listen(this.options.httpPort, this.options.httpHost, () => {
        logger.info(`HTTP server listening on ${this.options.httpHost}:${this.options.httpPort}`);
        logger.info(`MCP endpoint available at: http://${this.options.httpHost}:${this.options.httpPort}${this.options.httpEndpoint}`);
        resolve();
      });

      this.httpServer.on('error', (error: Error) => {
        logger.error('HTTP server error:', error);
        reject(error);
      });
    });
  }

  private async handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      
      if (url.pathname === this.options.httpEndpoint) {
        if (req.method === 'GET') {
          // For SSE transport, create and manage the connection
          try {
            logger.info('Creating SSE connection for client');
            
            // Create a new server instance for this SSE connection
            const sseServer = new Server(
              {
                name: config.server.name,
                version: config.server.version,
              },
              {
                capabilities: {
                  tools: {},
                  prompts: {},
                  logging: {},
                },
              }
            );
            
            // Register all handlers for this SSE server instance
            this.registerHandlers(sseServer);
            
            // Create SSE transport for this specific response
            const sseTransport = new SSEServerTransport(this.options.httpEndpoint!, res);
            
            logger.info('Connecting SSE server to transport');
            
            // Connect the SSE server to the transport
            await sseServer.connect(sseTransport);
            
            logger.info('SSE connection established and server connected');
            
            // The response is now handled by the SSE transport
            // Don't call res.end() as the transport manages the response
            
          } catch (sseError) {
            logger.error('SSE connection failed:', 
              sseError instanceof Error ? sseError : new Error(String(sseError)));
            
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to establish SSE connection' }));
            }
          }
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      } else if (url.pathname === '/health') {
        // Health check endpoint
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'healthy', 
          transport: this.options.transport,
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error) {
      logger.error('Request handling error:', 
        error instanceof Error ? error : new Error(String(error)));
      
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down SSE MCP Server...');
    
    try {
      // Close HTTP server if it exists
      if (this.httpServer) {
        await new Promise<void>((resolve, reject) => {
          this.httpServer!.close((error?: Error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
        logger.info('HTTP server stopped');
      }
      
      logger.info('SSE server shutdown complete');
    } catch (error) {
      logger.error('Error during SSE server shutdown:', 
        error instanceof Error ? error : new Error(String(error)));
    }
  }
}
