/**
 * SSE MCP Server Implementation
 */
import { MCPServer, ServerOptions, HandlerRegistrar } from './types.js';
export declare class SSEMCPServer implements MCPServer {
    private httpServer;
    private options;
    private registerHandlers;
    constructor(options: ServerOptions, registerHandlers: HandlerRegistrar);
    start(): Promise<void>;
    private initializeHttpServer;
    private handleHttpRequest;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=sse-server.d.ts.map