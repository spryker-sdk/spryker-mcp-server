"use strict";
/**
 * Tests for config module branch coverage
 */
describe('Config module edge cases', () => {
    beforeEach(() => {
        // Clear module cache to test different environment conditions
        jest.resetModules();
    });
    afterEach(() => {
        // Restore any modified environment variables
        delete process.env.SPRYKER_API_BASE_URL;
        delete process.env.SPRYKER_API_TIMEOUT;
        delete process.env.SPRYKER_API_RETRY_ATTEMPTS;
        delete process.env.SPRYKER_API_RETRY_DELAY;
        delete process.env.RATE_LIMIT_WINDOW_MS;
        delete process.env.RATE_LIMIT_MAX_REQUESTS;
        delete process.env.MCP_HTTP_PORT;
        delete process.env.MCP_HTTP_HOST;
        delete process.env.MCP_HTTP_ENDPOINT;
        delete process.env.LOG_LEVEL;
    });
    it('should use environment variables when provided', () => {
        // Set environment variables
        process.env.SPRYKER_API_BASE_URL = 'https://env-api.example.com';
        process.env.SPRYKER_API_TIMEOUT = '10000';
        process.env.SPRYKER_API_RETRY_ATTEMPTS = '5';
        process.env.SPRYKER_API_RETRY_DELAY = '2000';
        process.env.RATE_LIMIT_WINDOW_MS = '120000';
        process.env.RATE_LIMIT_MAX_REQUESTS = '200';
        process.env.MCP_HTTP_PORT = '4000';
        process.env.MCP_HTTP_HOST = '0.0.0.0';
        process.env.MCP_HTTP_ENDPOINT = '/custom-mcp';
        process.env.LOG_LEVEL = 'debug';
        // Import config after setting environment variables
        const { config } = require('../../src/config/index.js');
        expect(config.api.baseUrl).toBe('https://env-api.example.com');
        expect(config.api.timeout).toBe(10000);
        expect(config.api.retryAttempts).toBe(5);
        expect(config.api.retryDelay).toBe(2000);
        expect(config.rateLimit.windowMs).toBe(120000);
        expect(config.rateLimit.maxRequests).toBe(200);
        expect(config.mcp.http.port).toBe(4000);
        expect(config.mcp.http.host).toBe('0.0.0.0');
        expect(config.mcp.http.endpoint).toBe('/custom-mcp');
        expect(config.server.logLevel).toBe('debug');
    });
    it('should use default values when environment variables are not provided', () => {
        // Import config with no environment variables
        const { config } = require('../../src/config/index.js');
        expect(config.api.baseUrl).toBe('https://glue.de.scos-b2c.sh01.demo-spryker.com');
        expect(config.api.timeout).toBe(30000);
        expect(config.api.retryAttempts).toBe(3);
        expect(config.api.retryDelay).toBe(1000);
        expect(config.rateLimit.windowMs).toBe(60000);
        expect(config.rateLimit.maxRequests).toBe(100);
        expect(config.mcp.http.port).toBe(3000);
        expect(config.mcp.http.host).toBe('localhost');
        expect(config.mcp.http.endpoint).toBe('/mcp');
        expect(config.server.logLevel).toBe('info');
    });
    it('should handle invalid numeric environment variables', () => {
        // Set invalid numeric environment variables
        process.env.SPRYKER_API_TIMEOUT = 'invalid';
        process.env.SPRYKER_API_RETRY_ATTEMPTS = 'invalid';
        process.env.SPRYKER_API_RETRY_DELAY = 'invalid';
        process.env.RATE_LIMIT_WINDOW_MS = 'invalid';
        process.env.RATE_LIMIT_MAX_REQUESTS = 'invalid';
        process.env.MCP_HTTP_PORT = 'invalid';
        // Should throw validation error for invalid numeric values
        expect(() => {
            const { config } = require('../../src/config/index.js');
        }).toThrow('Expected number, received nan');
    });
});
//# sourceMappingURL=config.test.js.map