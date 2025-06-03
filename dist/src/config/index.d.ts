/**
 * Configuration management for Spryker MCP Server
 *
 * Centralizes all configuration settings and environment variable handling
 * with proper validation and type safety.
 */
/**
 * Validate and parse environment variables
 */
declare const env: {
    NODE_ENV: "development" | "production" | "test";
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    MCP_TRANSPORT: "stdio" | "http" | "sse";
    MCP_HTTP_PORT: number;
    MCP_HTTP_HOST: string;
    MCP_HTTP_ENDPOINT: string;
    SPRYKER_API_BASE_URL: string;
    SPRYKER_API_TIMEOUT: number;
    SPRYKER_API_RETRY_ATTEMPTS: number;
    SPRYKER_API_RETRY_DELAY: number;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    SPRYKER_CLIENT_ID?: string | undefined;
    SPRYKER_CLIENT_SECRET?: string | undefined;
};
/**
 * Typed configuration object
 */
export declare const config: {
    readonly server: {
        readonly name: "spryker-mcp-server";
        readonly version: "0.0.1";
        readonly environment: "development" | "production" | "test";
        readonly logLevel: "error" | "warn" | "info" | "debug";
    };
    readonly mcp: {
        readonly transport: "stdio" | "http" | "sse";
        readonly http: {
            readonly port: number;
            readonly host: string;
            readonly endpoint: string;
        };
    };
    readonly api: {
        readonly baseUrl: string;
        readonly timeout: number;
        readonly retryAttempts: number;
        readonly retryDelay: number;
    };
    readonly auth: {
        readonly clientId: string | undefined;
        readonly clientSecret: string | undefined;
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly maxRequests: number;
    };
    readonly features: {
        readonly enableGuestCheckout: true;
        readonly enableProductSearch: true;
        readonly enableCartOperations: true;
        readonly enableOrderManagement: true;
        readonly enableCustomerAuth: true;
    };
};
/**
 * Type definitions for better IDE support
 */
export type Config = typeof config;
export type Environment = typeof env.NODE_ENV;
export type LogLevel = typeof env.LOG_LEVEL;
export {};
//# sourceMappingURL=index.d.ts.map