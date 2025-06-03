/**
 * HTTP Transport Tests
 *
 * Tests for the HTTP/SSE transport functionality
 */
import { createServer } from '../src/index.js';
describe('HTTP Transport', () => {
    let server;
    afterEach(async () => {
        if (server) {
            await server.shutdown();
        }
    });
    test('should create server with HTTP transport options', () => {
        server = createServer({
            transport: 'http',
            httpPort: 3002,
            httpHost: 'localhost',
            httpEndpoint: '/test-mcp'
        });
        expect(server).toBeDefined();
    });
    test('should create server with SSE transport options', () => {
        server = createServer({
            transport: 'sse',
            httpPort: 3003,
            httpHost: 'localhost',
            httpEndpoint: '/test-sse'
        });
        expect(server).toBeDefined();
    });
    test('should create server with default stdio transport', () => {
        server = createServer({
            transport: 'stdio'
        });
        expect(server).toBeDefined();
    });
    test('should create server with stdio transport', () => {
        server = createServer({
            transport: 'stdio'
        });
        expect(server).toBeDefined();
    });
    test('should handle server shutdown gracefully', async () => {
        server = createServer({
            transport: 'stdio'
        });
        // Should not throw
        await expect(server.shutdown()).resolves.not.toThrow();
    });
});
//# sourceMappingURL=http-transport.test.js.map