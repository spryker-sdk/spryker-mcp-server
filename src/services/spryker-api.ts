/**
 * Spryker API Service
 * 
 * Centralized HTTP client for Spryker API interactions with proper
 * error handling, retry logic, and response formatting.
 */

import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * HTTP methods supported by the API service
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API request configuration
 */
interface ApiRequestConfig {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * API response wrapper
 */
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * API error class with additional context
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly statusText?: string,
    public readonly responseData?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Spryker API service class
 */
export class SprykerApiService {
  private static instance: SprykerApiService;
  
  private readonly baseUrl: string;
  private readonly defaultTimeout: number;
  private readonly defaultRetryAttempts: number;
  private readonly retryDelay: number;

  constructor() {
    this.baseUrl = config.api.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultTimeout = config.api.timeout;
    this.defaultRetryAttempts = config.api.retryAttempts;
    this.retryDelay = config.api.retryDelay;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SprykerApiService {
    if (!SprykerApiService.instance) {
      SprykerApiService.instance = new SprykerApiService();
    }
    return SprykerApiService.instance;
  }

  /**
   * Build headers for API requests
   */
  private buildHeaders(token?: string, additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'access-control-allow-origin': '*',
      'content-language': 'en_US',
      'User-Agent': `${config.server.name}/${config.server.version}`,
    };

    if (token) {
      // Check if this is a guest token (starts with 'guest-')
      if (token.startsWith('guest-')) {
        headers['X-Anonymous-Customer-Unique-Id'] = token;
      } else {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return { ...headers, ...additionalHeaders };
  }

  /**
   * Build full URL for API endpoints
   */
  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  /**
   * Sleep for retry delay
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const { method, url, headers, body, timeout = this.defaultTimeout, retryAttempts = this.defaultRetryAttempts } = config;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        logger.debug(`API request attempt ${attempt + 1}/${retryAttempts + 1}`, {
          method,
          url,
          attempt,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const fetchConfig: {
          method: string;
          signal: AbortSignal;
          headers?: Record<string, string>;
          body?: string;
        } = {
          method,
          signal: controller.signal,
        };

        if (headers) {
          fetchConfig.headers = headers;
        }

        if (body) {
          fetchConfig.body = JSON.stringify(body);
        }

        const response = await fetch(url, fetchConfig);
        clearTimeout(timeoutId);

        // Parse response
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        let responseData: T;
        const contentType = response.headers.get('content-type');
        
        logger.info('Response content type', { contentType });
        
        // Check for JSON content types (including application/vnd.api+json)
        if (contentType?.includes('application/json') || contentType?.includes('application/vnd.api+json')) {
          responseData = await response.json() as T;
          logger.info('Parsed JSON response', { 
            type: typeof responseData,
            isArray: Array.isArray(responseData),
            keys: responseData ? Object.keys(responseData as any).slice(0, 5) : []
          });
        } else {
          responseData = await response.text() as unknown as T;
          logger.info('Got text response', { 
            type: typeof responseData,
            length: (responseData as any)?.length 
          });
        }

        // Check for HTTP errors
        if (!response.ok) {
          throw new ApiError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            response.statusText,
            responseData
          );
        }

        logger.debug('API request successful', {
          method,
          url,
          status: response.status,
          attempt,
        });

        return {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        };

      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof ApiError) {
          // Don't retry client errors (4xx)
          if (error.status && error.status >= 400 && error.status < 500) {
            throw error;
          }
        }

        // If this was the last attempt, throw the error
        if (attempt === retryAttempts) {
          break;
        }

        // Wait before retrying
        const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
        logger.warn(`API request failed, retrying in ${delay}ms`, {
          method,
          url,
          attempt,
          error: lastError.message,
        });
        
        await this.sleep(delay);
      }
    }

    // If we get here, all attempts failed
    logger.error('API request failed after all retry attempts', {
      method,
      url,
      attempts: retryAttempts + 1,
      error: lastError?.message,
    });
    
    throw lastError || new Error('Request failed after all retry attempts');
  }

  /**
   * Make a GET request
   */
  async get<T = unknown>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(token);

    return this.executeRequest<T>({
      method: 'GET',
      url,
      headers,
    });
  }

  /**
   * Make a POST request
   */
  async post<T = unknown>(endpoint: string, data?: unknown, token?: string): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(token);

    return this.executeRequest<T>({
      method: 'POST',
      url,
      headers,
      body: data,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T = unknown>(endpoint: string, data?: unknown, token?: string): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(token);

    return this.executeRequest<T>({
      method: 'PUT',
      url,
      headers,
      body: data,
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T = unknown>(endpoint: string, data?: unknown, token?: string): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(token);

    return this.executeRequest<T>({
      method: 'PATCH',
      url,
      headers,
      body: data,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = unknown>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(token);

    return this.executeRequest<T>({
      method: 'DELETE',
      url,
      headers,
    });
  }

  /**
   * General request method with query parameters support
   */
  async request<T = unknown>(
    method: HttpMethod,
    endpoint: string,
    options?: {
      data?: unknown;
      token?: string;
      params?: Record<string, string>;
    }
  ): Promise<ApiResponse<T>> {
    let url = this.buildUrl(endpoint);
    
    // Add query parameters
    if (options?.params) {
      const searchParams = new URLSearchParams(options.params);
      url += `?${searchParams.toString()}`;
    }
    
    const headers = this.buildHeaders(options?.token);
    
    return this.executeRequest<T>({
      method,
      url,
      headers,
      body: options?.data,
    });
  }
}

/**
 * Singleton instance of the Spryker API service
 */
export const sprykerApi = new SprykerApiService();
