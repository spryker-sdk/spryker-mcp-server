/**
 * HTTP MCP Server Implementation
 */
import { MCPServer, ServerOptions, HandlerRegistrar } from './types.js';
export declare class HttpMCPServer implements MCPServer {
    private httpServer;
    private options;
    private registerHandlers;
    private transports;
    constructor(options: ServerOptions, registerHandlers: HandlerRegistrar);
    start(): Promise<void>;
    private initializeHttpServer;
    private handleHttpRequest;
    private handleMCPRequest;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=http-server.d.ts.map