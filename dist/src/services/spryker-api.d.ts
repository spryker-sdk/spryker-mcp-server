/**
 * Spryker API Service
 *
 * Centralized HTTP client for Spryker API interactions with proper
 * error handling, retry logic, and response formatting.
 */
/**
 * HTTP methods supported by the API service
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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
export declare class ApiError extends Error {
    readonly status?: number | undefined;
    readonly statusText?: string | undefined;
    readonly responseData?: unknown | undefined;
    constructor(message: string, status?: number | undefined, statusText?: string | undefined, responseData?: unknown | undefined);
}
/**
 * Spryker API service class
 */
export declare class SprykerApiService {
    private static instance;
    private readonly baseUrl;
    private readonly defaultTimeout;
    private readonly defaultRetryAttempts;
    private readonly retryDelay;
    constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): SprykerApiService;
    /**
     * Build headers for API requests
     */
    private buildHeaders;
    /**
     * Build full URL for API endpoints
     */
    private buildUrl;
    /**
     * Sleep for retry delay
     */
    private sleep;
    /**
     * Execute HTTP request with retry logic
     */
    private executeRequest;
    /**
     * Make a GET request
     */
    get<T = unknown>(endpoint: string, token?: string): Promise<ApiResponse<T>>;
    /**
     * Make a POST request
     */
    post<T = unknown>(endpoint: string, data?: unknown, token?: string): Promise<ApiResponse<T>>;
    /**
     * Make a PUT request
     */
    put<T = unknown>(endpoint: string, data?: unknown, token?: string): Promise<ApiResponse<T>>;
    /**
     * Make a PATCH request
     */
    patch<T = unknown>(endpoint: string, data?: unknown, token?: string): Promise<ApiResponse<T>>;
    /**
     * Make a DELETE request
     */
    delete<T = unknown>(endpoint: string, token?: string): Promise<ApiResponse<T>>;
    /**
     * General request method with query parameters support
     */
    request<T = unknown>(method: HttpMethod, endpoint: string, options?: {
        data?: unknown;
        token?: string;
        params?: Record<string, string>;
    }): Promise<ApiResponse<T>>;
}
/**
 * Singleton instance of the Spryker API service
 */
export declare const sprykerApi: SprykerApiService;
export {};
//# sourceMappingURL=spryker-api.d.ts.map