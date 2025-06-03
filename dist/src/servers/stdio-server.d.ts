/**
 * Stdio MCP Server Implementation
 */
import { MCPServer, ServerOptions, HandlerRegistrar } from './types.js';
export declare class StdioMCPServer implements MCPServer {
    private server;
    private transport;
    private options;
    private registerHandlers;
    constructor(options: ServerOptions, registerHandlers: HandlerRegistrar);
    start(): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=stdio-server.d.ts.map