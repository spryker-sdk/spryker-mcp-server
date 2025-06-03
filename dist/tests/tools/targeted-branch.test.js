/**
 * Targeted tests for missing branches in specific tools
 */
// Mock dependencies
const mockConfig = {
    api: {
        baseUrl: 'https://test-api.example.com',
        timeout: 5000,
        retryAttempts: 3,
        retryDelay: 1000
    }
};
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
};
jest.mock('../../src/config/index.js', () => ({
    config: mockConfig
}));
jest.mock('../../src/utils/logger.js', () => ({
    logger: mockLogger
}));
// Mock SprykerApiService
const mockApiMethods = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
};
jest.mock('../../src/services/spryker-api.js', () => ({
    SprykerApiService: {
        getInstance: () => mockApiMethods
    },
    ApiError: class ApiError extends Error {
        status;
        statusText;
        responseData;
        constructor(message, status, statusText, responseData) {
            super(message);
            this.status = status;
            this.statusText = statusText;
            this.responseData = responseData;
            this.name = 'ApiError';
            this.status = status;
            this.statusText = statusText;
            this.responseData = responseData;
        }
    }
}));
import { getCartTool } from '../../src/tools/get-cart.js';
import { authenticateTool } from '../../src/tools/authenticate.js';
// Get reference to mocked API methods
const mockApiService = mockApiMethods;
describe('Targeted Branch Coverage Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('getCartTool missing branches', () => {
        it('should handle empty cart array response', async () => {
            mockApiService.get.mockResolvedValueOnce({
                data: [], // Empty array
                status: 200,
                statusText: 'OK',
                headers: {}
            });
            const result = await getCartTool.handler({
                token: 'customer-token'
                // No cartId - this should trigger the "no carts found" branch
            });
            expect(result.content?.[0]?.text).toContain('No carts found');
            expect(result.content?.[0]?.text).toContain('success": true');
        });
        it('should handle guest cart request without cartId', async () => {
            mockApiService.get.mockResolvedValueOnce({
                data: [{ id: 'guest-cart-1', items: [] }],
                status: 200,
                statusText: 'OK',
                headers: {}
            });
            const result = await getCartTool.handler({
                token: 'guest-abc123'
                // No cartId - this should trigger guest-carts endpoint
            });
            expect(mockApiService.get).toHaveBeenCalledWith('guest-carts', 'guest-abc123');
            expect(result.content?.[0]?.text).toContain('success": true');
        });
    });
    describe('authenticateTool missing branches', () => {
        it('should handle non-Error authentication failure', async () => {
            // Mock authentication failure with non-Error object
            mockApiService.post.mockRejectedValueOnce('String error');
            const result = await authenticateTool.handler({
                username: 'test@example.com',
                password: 'wrongpassword'
            });
            expect(result.content?.[0]?.text).toContain('success": false');
        });
    });
});
//# sourceMappingURL=targeted-branch.test.js.map