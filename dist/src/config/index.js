/**
 * Configuration management for Spryker MCP Server
 *
 * Centralizes all configuration settings and environment variable handling
 * with proper validation and type safety.
 */
import { z } from 'zod';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
/**
 * Environment configuration schema with validation
 */
const envSchema = z.object({
    // Server configuration
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    // MCP Server configuration
    MCP_TRANSPORT: z.enum(['stdio', 'http', 'sse']).default('stdio'),
    MCP_HTTP_PORT: z.coerce.number().positive().default(3000),
    MCP_HTTP_HOST: z.string().default('localhost'),
    MCP_HTTP_ENDPOINT: z.string().default('/mcp'),
    // Spryker API configuration
    SPRYKER_API_BASE_URL: z.string().url().default('https://glue.eu.spryker.local'),
    SPRYKER_API_TIMEOUT: z.coerce.number().positive().default(30000),
    SPRYKER_API_RETRY_ATTEMPTS: z.coerce.number().nonnegative().default(3),
    SPRYKER_API_RETRY_DELAY: z.coerce.number().positive().default(1000),
    // Authentication (optional for some operations)
    SPRYKER_CLIENT_ID: z.string().optional(),
    SPRYKER_CLIENT_SECRET: z.string().optional(),
    // Rate limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(60000), // 1 minute
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().default(100),
});
/**
 * Validate and parse environment variables
 */
const env = envSchema.parse(process.env);
/**
 * Typed configuration object
 */
export const config = {
    // Server settings
    server: {
        name: 'spryker-mcp-server',
        version: '0.0.1',
        environment: env.NODE_ENV,
        logLevel: env.LOG_LEVEL,
    },
    // MCP Server settings
    mcp: {
        transport: env.MCP_TRANSPORT,
        http: {
            port: env.MCP_HTTP_PORT,
            host: env.MCP_HTTP_HOST,
            endpoint: env.MCP_HTTP_ENDPOINT,
        },
    },
    // API configuration
    api: {
        baseUrl: env.SPRYKER_API_BASE_URL,
        timeout: env.SPRYKER_API_TIMEOUT,
        retryAttempts: env.SPRYKER_API_RETRY_ATTEMPTS,
        retryDelay: env.SPRYKER_API_RETRY_DELAY,
    },
    // Authentication
    auth: {
        clientId: env.SPRYKER_CLIENT_ID,
        clientSecret: env.SPRYKER_CLIENT_SECRET,
    },
    // Rate limiting
    rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
    // Feature flags
    features: {
        enableGuestCheckout: true,
        enableProductSearch: true,
        enableCartOperations: true,
        enableOrderManagement: true,
        enableCustomerAuth: true,
    },
};
//# sourceMappingURL=index.js.map