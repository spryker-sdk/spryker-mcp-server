/**
 * Base server functionality shared across all transport types
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
/**
 * Base server class with common functionality
 */
export declare abstract class BaseServer {
    protected server: Server;
    constructor();
    /**
     * Register all MCP handlers on the server instance
     */
    protected registerHandlers(): void;
    /**
     * Start the server (to be implemented by subclasses)
     */
    abstract start(): Promise<void>;
    /**
     * Shutdown the server (to be implemented by subclasses)
     */
    abstract shutdown(): Promise<void>;
}
//# sourceMappingURL=base-server.d.ts.map