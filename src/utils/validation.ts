/**
 * Environment and runtime validation utilities
 * 
 * Provides validation functions to ensure the server environment
 * is properly configured and all required dependencies are available.
 */

import { config } from '../config/index.js';
import { logger } from './logger.js';

/**
 * Validation error class for environment issues
 */
export class ValidationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Check if a URL is accessible
 */
async function checkUrlAccessibility(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.status < 500; // Accept any non-server error status
  } catch {
    return false;
  }
}

/**
 * Validate Node.js version compatibility
 */
function validateNodeVersion(): void {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0] || '0', 10);
  
  if (majorVersion < 18) {
    throw new ValidationError(
      `Node.js version ${nodeVersion} is not supported. Minimum required version is 18.0.0.`,
      'INVALID_NODE_VERSION'
    );
  }
  
  logger.debug(`Node.js version ${nodeVersion} is compatible`);
}

/**
 * Validate required environment variables
 */
function validateEnvironmentVariables(): void {
  const requiredVars = [];
  
  // Check for critical missing environment variables
  if (!config.api.baseUrl) {
    requiredVars.push('SPRYKER_API_BASE_URL');
  }
  
  if (requiredVars.length > 0) {
    throw new ValidationError(
      `Missing required environment variables: ${requiredVars.join(', ')}`,
      'MISSING_ENV_VARS'
    );
  }
  
  logger.debug('Environment variables validation passed');
}

/**
 * Validate API connectivity
 */
async function validateApiConnectivity(): Promise<void> {
  const baseUrl = config.api.baseUrl;
  
  logger.debug(`Testing connectivity to Spryker API: ${baseUrl}`);
  
  const isAccessible = await checkUrlAccessibility(baseUrl);
  
  if (!isAccessible) {
    logger.warn(`Unable to connect to Spryker API at ${baseUrl}. This may cause API calls to fail.`);
    // Don't throw error here as the API might be temporarily unavailable
    return;
  }
  
  logger.debug('Spryker API connectivity check passed');
}

/**
 * Validate server configuration
 */
function validateServerConfig(): void {
  // Validate timeout values
  if (config.api.timeout <= 0) {
    throw new ValidationError(
      'API timeout must be greater than 0',
      'INVALID_API_TIMEOUT'
    );
  }
  
  // Validate retry configuration
  if (config.api.retryAttempts < 0) {
    throw new ValidationError(
      'Retry attempts must be non-negative',
      'INVALID_RETRY_ATTEMPTS'
    );
  }
  
  if (config.api.retryDelay <= 0) {
    throw new ValidationError(
      'Retry delay must be greater than 0',
      'INVALID_RETRY_DELAY'
    );
  }
  
  // Validate rate limiting
  if (config.rateLimit.windowMs <= 0) {
    throw new ValidationError(
      'Rate limit window must be greater than 0',
      'INVALID_RATE_LIMIT_WINDOW'
    );
  }
  
  if (config.rateLimit.maxRequests <= 0) {
    throw new ValidationError(
      'Rate limit max requests must be greater than 0',
      'INVALID_RATE_LIMIT_MAX'
    );
  }
  
  logger.debug('Server configuration validation passed');
}

/**
 * Validate all environment and configuration requirements
 */
export async function validateEnvironment(): Promise<void> {
  logger.info('Starting environment validation...');
  
  try {
    // Synchronous validations
    validateNodeVersion();
    validateEnvironmentVariables();
    validateServerConfig();
    
    // Asynchronous validations (non-blocking)
    await validateApiConnectivity();
    
    logger.info('Environment validation completed successfully');
    
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.error(`Environment validation failed: ${error.message}`, { code: error.code });
      throw error;
    }
    
    logger.error('Unexpected error during environment validation', error as Error);
    throw new ValidationError(
      'Environment validation failed due to unexpected error',
      'VALIDATION_ERROR'
    );
  }
}

/**
 * Validate tool arguments against a schema
 */
export function validateToolArguments<T>(
  args: unknown,
  schema: { parse: (data: unknown) => T },
  toolName: string
): T {
  try {
    return schema.parse(args);
  } catch (error) {
    logger.warn(`Invalid arguments for tool ${toolName}`, { args, error });
    throw new ValidationError(
      `Invalid arguments for tool ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'INVALID_TOOL_ARGUMENTS'
    );
  }
}
