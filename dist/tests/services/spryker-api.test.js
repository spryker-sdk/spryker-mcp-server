/**
 * Tests for Spryker API Service
 */
// Mock config first
jest.mock('../../src/config/index.js', () => ({
    config: {
        server: {
            logLevel: 'info'
        },
        api: {
            baseUrl: 'https://test-api.example.com',
            timeout: 5000,
            retryAttempts: 3,
            retryDelay: 1000
        }
    }
}));
import { SprykerApiService, ApiError } from '../../src/services/spryker-api.js';
// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;
// Helper to create mock headers that implement the Headers interface
const createMockHeaders = (entries) => {
    const map = new Map(entries);
    return {
        forEach: (callback) => {
            map.forEach(callback);
        },
        get: (key) => map.get(key) || null,
        has: (key) => map.has(key),
        set: (key, value) => map.set(key, value),
        delete: (key) => map.delete(key),
        entries: () => map.entries(),
        keys: () => map.keys(),
        values: () => map.values(),
        [Symbol.iterator]: () => map[Symbol.iterator]()
    };
};
// Mock AbortController
const mockAbort = jest.fn();
const mockAbortController = {
    signal: { aborted: false },
    abort: mockAbort,
};
global.AbortController = jest.fn(() => mockAbortController);
// Mock setTimeout and clearTimeout
global.setTimeout = jest.fn((fn, delay) => {
    if (typeof fn === 'function') {
        fn();
    }
    return 123;
});
global.clearTimeout = jest.fn();
describe('SprykerApiService', () => {
    let service;
    beforeEach(() => {
        service = new SprykerApiService();
        mockFetch.mockClear();
        mockAbort.mockClear();
        jest.clearAllMocks();
    });
    describe('HTTP methods', () => {
        it('should make a successful GET request', async () => {
            const mockResponse = { data: 'test' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: createMockHeaders([['content-type', 'application/json']]),
                json: () => Promise.resolve(mockResponse),
                text: () => Promise.resolve(JSON.stringify(mockResponse)),
            });
            const result = await service.get('/test-endpoint');
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test-endpoint'), expect.objectContaining({
                method: 'GET',
                signal: mockAbortController.signal,
            }));
            expect(result.data).toEqual(mockResponse);
            expect(result.status).toBe(200);
        });
        it('should make a successful POST request with data', async () => {
            const mockResponse = { success: true };
            const requestData = { name: 'test' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                headers: createMockHeaders([['content-type', 'application/json']]),
                json: () => Promise.resolve(mockResponse),
                text: () => Promise.resolve(JSON.stringify(mockResponse)),
            });
            const result = await service.post('/test-endpoint', requestData);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test-endpoint'), expect.objectContaining({
                method: 'POST',
                signal: mockAbortController.signal,
                body: JSON.stringify(requestData),
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                }),
            }));
            expect(result.data).toEqual(mockResponse);
        });
        it('should make PUT request', async () => {
            const mockResponse = { updated: true };
            const requestData = { name: 'updated' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: createMockHeaders([['content-type', 'application/json']]),
                json: () => Promise.resolve(mockResponse),
                text: () => Promise.resolve(JSON.stringify(mockResponse)),
            });
            const result = await service.put('/test-endpoint', requestData);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test-endpoint'), expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify(requestData),
            }));
            expect(result.data).toEqual(mockResponse);
        });
        it('should make PATCH request', async () => {
            const mockResponse = { patched: true };
            const requestData = { name: 'patched' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: createMockHeaders([['content-type', 'application/json']]),
                json: () => Promise.resolve(mockResponse),
                text: () => Promise.resolve(JSON.stringify(mockResponse)),
            });
            const result = await service.patch('/test-endpoint', requestData);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test-endpoint'), expect.objectContaining({
                method: 'PATCH',
                body: JSON.stringify(requestData),
            }));
            expect(result.data).toEqual(mockResponse);
        });
        it('should make DELETE request', async () => {
            const mockResponse = { deleted: true };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: createMockHeaders([['content-type', 'application/json']]),
                json: () => Promise.resolve(mockResponse),
                text: () => Promise.resolve(JSON.stringify(mockResponse)),
            });
            const result = await service.delete('/test-endpoint');
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test-endpoint'), expect.objectContaining({
                method: 'DELETE',
            }));
            expect(result.data).toEqual(mockResponse);
        });
    });
    describe('authentication headers', () => {
        it('should include Bearer token for authenticated requests', async () => {
            const token = 'token123';
            const mockResponse = { data: 'test' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: createMockHeaders([['content-type', 'application/json']]),
                json: () => Promise.resolve(mockResponse),
                text: () => Promise.resolve(JSON.stringify(mockResponse)),
            });
            await service.get('/test-endpoint', token);
            expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': `Bearer ${token}`,
                }),
            }));
        });
        it('should include guest header for guest tokens', async () => {
            const guestToken = 'guest-12345';
            const mockResponse = { data: 'test' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: createMockHeaders([['content-type', 'application/json']]),
                json: () => Promise.resolve(mockResponse),
                text: () => Promise.resolve(JSON.stringify(mockResponse)),
            });
            await service.get('/test-endpoint', guestToken);
            expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                headers: expect.objectContaining({
                    'X-Anonymous-Customer-Unique-Id': guestToken,
                }),
            }));
        });
    });
    describe('error handling', () => {
        it('should handle 404 errors', async () => {
            const errorResponse = { error: 'Not found' };
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                headers: createMockHeaders([['content-type', 'application/json']]),
                json: () => Promise.resolve(errorResponse),
                text: () => Promise.resolve(JSON.stringify(errorResponse)),
            });
            await expect(service.get('/nonexistent'))
                .rejects
                .toThrow(ApiError);
        });
        it('should handle 500 errors', async () => {
            const errorResponse = { error: 'Internal server error' };
            // Use mockResolvedValue instead of mockResolvedValueOnce because 5xx errors are retried
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                headers: createMockHeaders([['content-type', 'application/json']]),
                json: () => Promise.resolve(errorResponse),
                text: () => Promise.resolve(JSON.stringify(errorResponse)),
            });
            await expect(service.get('/server-error'))
                .rejects
                .toThrow(ApiError);
            // Reset the mock for other tests
            mockFetch.mockClear();
        });
        it('should handle network errors', async () => {
            // Mock a network failure by making fetch reject immediately
            const networkError = new Error('Network failure');
            mockFetch.mockRejectedValue(networkError);
            // Since the service has retries, we need to expect it to retry multiple times
            // The service is configured with 3 retry attempts, so it will try 4 times total
            await expect(service.get('/test-endpoint'))
                .rejects
                .toThrow('Network failure');
            // Reset the mock for other tests
            mockFetch.mockClear();
        });
    });
    describe('response parsing', () => {
        it('should parse JSON responses', async () => {
            const mockData = { message: 'success', items: [1, 2, 3] };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: createMockHeaders([['content-type', 'application/json']]),
                json: () => Promise.resolve(mockData),
                text: () => Promise.resolve(JSON.stringify(mockData)),
            });
            const result = await service.get('/test-endpoint');
            expect(result.data).toEqual(mockData);
        });
        it('should parse JSON API responses', async () => {
            const mockData = { data: { type: 'products', id: '123' } };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: createMockHeaders([['content-type', 'application/vnd.api+json']]),
                json: () => Promise.resolve(mockData),
                text: () => Promise.resolve(JSON.stringify(mockData)),
            });
            const result = await service.get('/test-endpoint');
            expect(result.data).toEqual(mockData);
        });
        it('should handle text responses', async () => {
            const textData = 'Plain text response';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: createMockHeaders([['content-type', 'text/plain']]),
                json: () => Promise.reject(new Error('Not JSON')),
                text: () => Promise.resolve(textData),
            });
            const result = await service.get('/test-endpoint');
            expect(result.data).toBe(textData);
        });
    });
    describe('retry logic', () => {
        it('should retry failed requests', async () => {
            // First call fails, second succeeds
            const successResponse = { data: 'success' };
            mockFetch
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: createMockHeaders([['content-type', 'application/json']]),
                json: () => Promise.resolve(successResponse),
                text: () => Promise.resolve(JSON.stringify(successResponse)),
            });
            const result = await service.get('/test-endpoint');
            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(result.data).toEqual(successResponse);
        });
    });
    describe('request method', () => {
        it('should handle custom request configurations', async () => {
            const mockResponse = { custom: true };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: createMockHeaders([['content-type', 'application/json']]),
                json: () => Promise.resolve(mockResponse),
                text: () => Promise.resolve(JSON.stringify(mockResponse)),
            });
            const result = await service.request('POST', '/custom-endpoint', {
                data: { customData: 'test' }
            });
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/custom-endpoint'), expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ customData: 'test' }),
            }));
            expect(result.data).toEqual(mockResponse);
        });
    });
    describe('ApiError', () => {
        it('should create proper error objects', () => {
            const error = new ApiError('Test error', 404, 'Not Found', { error: 'data' });
            expect(error.message).toBe('Test error');
            expect(error.status).toBe(404);
            expect(error.statusText).toBe('Not Found');
            expect(error.responseData).toEqual({ error: 'data' });
            expect(error.name).toBe('ApiError');
        });
    });
});
//# sourceMappingURL=spryker-api.test.js.map