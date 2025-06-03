/**
 * Spryker API Service
 *
 * Centralized HTTP client for Spryker API interactions with proper
 * error handling, retry logic, and response formatting.
 */
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
/**
 * API error class with additional context
 */
export class ApiError extends Error {
    status;
    statusText;
    responseData;
    constructor(message, status, statusText, responseData) {
        super(message);
        this.status = status;
        this.statusText = statusText;
        this.responseData = responseData;
        this.name = 'ApiError';
    }
}
/**
 * Spryker API service class
 */
export class SprykerApiService {
    static instance;
    baseUrl;
    defaultTimeout;
    defaultRetryAttempts;
    retryDelay;
    constructor() {
        this.baseUrl = config.api.baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.defaultTimeout = config.api.timeout;
        this.defaultRetryAttempts = config.api.retryAttempts;
        this.retryDelay = config.api.retryDelay;
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!SprykerApiService.instance) {
            SprykerApiService.instance = new SprykerApiService();
        }
        return SprykerApiService.instance;
    }
    /**
     * Build headers for API requests
     */
    buildHeaders(token, additionalHeaders) {
        const headers = {
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
            }
            else {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return { ...headers, ...additionalHeaders };
    }
    /**
     * Build full URL for API endpoints
     */
    buildUrl(endpoint) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        return `${this.baseUrl}/${cleanEndpoint}`;
    }
    /**
     * Sleep for retry delay
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Execute HTTP request with retry logic
     */
    async executeRequest(config) {
        const { method, url, headers, body, timeout = this.defaultTimeout, retryAttempts = this.defaultRetryAttempts } = config;
        let lastError = null;
        for (let attempt = 0; attempt <= retryAttempts; attempt++) {
            try {
                logger.debug(`API request attempt ${attempt + 1}/${retryAttempts + 1}`, {
                    method,
                    url,
                    attempt,
                });
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                const fetchConfig = {
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
                const responseHeaders = {};
                response.headers.forEach((value, key) => {
                    responseHeaders[key] = value;
                });
                let responseData;
                const contentType = response.headers.get('content-type');
                logger.info('Response content type', { contentType });
                // Check for JSON content types (including application/vnd.api+json)
                if (contentType?.includes('application/json') || contentType?.includes('application/vnd.api+json')) {
                    responseData = await response.json();
                    logger.info('Parsed JSON response', {
                        type: typeof responseData,
                        isArray: Array.isArray(responseData),
                        keys: responseData ? Object.keys(responseData).slice(0, 5) : []
                    });
                }
                else {
                    responseData = await response.text();
                    logger.info('Got text response', {
                        type: typeof responseData,
                        length: responseData?.length
                    });
                }
                // Check for HTTP errors
                if (!response.ok) {
                    throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status, response.statusText, responseData);
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
            }
            catch (error) {
                lastError = error;
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
    async get(endpoint, token) {
        const url = this.buildUrl(endpoint);
        const headers = this.buildHeaders(token);
        return this.executeRequest({
            method: 'GET',
            url,
            headers,
        });
    }
    /**
     * Make a POST request
     */
    async post(endpoint, data, token) {
        const url = this.buildUrl(endpoint);
        const headers = this.buildHeaders(token);
        return this.executeRequest({
            method: 'POST',
            url,
            headers,
            body: data,
        });
    }
    /**
     * Make a PUT request
     */
    async put(endpoint, data, token) {
        const url = this.buildUrl(endpoint);
        const headers = this.buildHeaders(token);
        return this.executeRequest({
            method: 'PUT',
            url,
            headers,
            body: data,
        });
    }
    /**
     * Make a PATCH request
     */
    async patch(endpoint, data, token) {
        const url = this.buildUrl(endpoint);
        const headers = this.buildHeaders(token);
        return this.executeRequest({
            method: 'PATCH',
            url,
            headers,
            body: data,
        });
    }
    /**
     * Make a DELETE request
     */
    async delete(endpoint, token) {
        const url = this.buildUrl(endpoint);
        const headers = this.buildHeaders(token);
        return this.executeRequest({
            method: 'DELETE',
            url,
            headers,
        });
    }
    /**
     * General request method with query parameters support
     */
    async request(method, endpoint, options) {
        let url = this.buildUrl(endpoint);
        // Add query parameters
        if (options?.params) {
            const searchParams = new URLSearchParams(options.params);
            url += `?${searchParams.toString()}`;
        }
        const headers = this.buildHeaders(options?.token);
        return this.executeRequest({
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
//# sourceMappingURL=spryker-api.js.map