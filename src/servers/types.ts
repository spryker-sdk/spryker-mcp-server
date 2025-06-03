/**
 * Common interfaces for MCP server implementations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';

/**
 * Transport types supported by the server
 */
export type TransportType = 'stdio' | 'http' | 'sse';

/**
 * Common server options interface
 */
export interface ServerOptions {
  transport: TransportType;
  httpPort?: number;
  httpHost?: string;
  httpEndpoint?: string;
}

/**
 * Interface for MCP server implementations
 */
export interface MCPServer {
  /**
   * Start the MCP server
   */
  start(): Promise<void>;

  /**
   * Gracefully shutdown the server
   */
  shutdown(): Promise<void>;
}

/**
 * Handler registration function type
 */
export type HandlerRegistrar = (server: Server) => void;
