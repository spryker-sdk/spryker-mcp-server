/**
 * Tests for cart-related tool functions with branch coverage
 */
// Mock config and dependencies
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
import { addToCartTool } from '../../src/tools/add-to-cart.js';
import { removeFromCartTool } from '../../src/tools/remove-from-cart.js';
import { updateCartItemTool } from '../../src/tools/update-cart-item.js';
import { guestAddToCartTool } from '../../src/tools/guest-add-to-cart.js';
// Get reference to mocked API methods
const mockApiService = mockApiMethods;
describe('Cart Tools Branch Coverage Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('addToCartTool error handling', () => {
        it('should handle network errors in addToCartTool', async () => {
            mockApiService.get.mockRejectedValueOnce(new Error('Network error'));
            const result = await addToCartTool.handler({
                sku: 'TEST-SKU',
                quantity: 1,
                token: 'token123'
            });
            expect(result.content?.[0]?.text).toContain('success": false');
        });
        it('should handle cart creation errors', async () => {
            mockApiService.get.mockResolvedValueOnce({
                data: [],
                status: 200,
                statusText: 'OK',
                headers: {}
            });
            mockApiService.post.mockRejectedValueOnce(new Error('Cart creation failed'));
            const result = await addToCartTool.handler({
                sku: 'TEST-SKU',
                quantity: 1,
                token: 'token123'
            });
            expect(result.content?.[0]?.text).toContain('success": false');
        });
    });
    describe('removeFromCartTool error handling', () => {
        it('should handle network errors in removeFromCartTool', async () => {
            mockApiService.get.mockRejectedValueOnce(new Error('Network error'));
            const result = await removeFromCartTool.handler({
                cartId: 'cart123',
                itemId: 'item456',
                token: 'token123'
            });
            expect(result.content?.[0]?.text).toContain('Failed to remove item from cart');
        });
        it('should handle missing cart in removeFromCartTool', async () => {
            mockApiService.get.mockResolvedValueOnce({
                data: null,
                status: 404,
                statusText: 'Not Found',
                headers: {}
            });
            const result = await removeFromCartTool.handler({
                cartId: 'cart123',
                itemId: 'item456',
                token: 'token123'
            });
            expect(result.content?.[0]?.text).toContain('Failed to remove item from cart');
        });
    });
    describe('updateCartItemTool error handling', () => {
        it('should handle network errors in updateCartItemTool', async () => {
            mockApiService.get.mockRejectedValueOnce(new Error('Network error'));
            const result = await updateCartItemTool.handler({
                cartId: 'cart123',
                itemId: 'item456',
                quantity: 2,
                token: 'token123'
            });
            expect(result.content?.[0]?.text).toContain('Failed to update cart item');
        });
        it('should handle missing cart in updateCartItemTool', async () => {
            mockApiService.get.mockResolvedValueOnce({
                data: null,
                status: 404,
                statusText: 'Not Found',
                headers: {}
            });
            const result = await updateCartItemTool.handler({
                cartId: 'cart123',
                itemId: 'item456',
                quantity: 2,
                token: 'token123'
            });
            expect(result.content?.[0]?.text).toContain('Failed to update cart item');
        });
    });
    describe('guestAddToCartTool error handling', () => {
        it('should handle network errors in guestAddToCartTool', async () => {
            mockApiService.post.mockRejectedValueOnce(new Error('Network error'));
            const result = await guestAddToCartTool.handler({
                sku: 'TEST-SKU',
                quantity: 1,
                token: 'guest-token-123'
            });
            expect(result.content?.[0]?.text).toContain('success": false');
        });
        it('should handle API errors in guestAddToCartTool', async () => {
            mockApiService.post.mockRejectedValueOnce(new Error('Product not found'));
            const result = await guestAddToCartTool.handler({
                sku: 'INVALID-SKU',
                quantity: 1,
                token: 'guest-token-123'
            });
            expect(result.content?.[0]?.text).toContain('success": false');
        });
    });
    describe('successful operations with branch coverage', () => {
        it('should successfully add to cart with existing cart', async () => {
            mockApiService.get.mockResolvedValueOnce({
                data: [{
                        type: 'carts',
                        id: 'existing-cart-123',
                        attributes: {
                            totals: { grandTotal: 1000 }
                        }
                    }],
                status: 200,
                statusText: 'OK',
                headers: {}
            });
            mockApiService.post.mockResolvedValueOnce({
                data: {
                    type: 'items',
                    id: 'item-123',
                    attributes: {
                        sku: 'TEST-SKU',
                        quantity: 1
                    }
                },
                status: 201,
                statusText: 'Created',
                headers: {}
            });
            const result = await addToCartTool.handler({
                sku: 'TEST-SKU',
                quantity: 1,
                token: 'token123'
            });
            expect(result.content?.[0]?.text).toContain('success');
        });
        it('should successfully remove from cart', async () => {
            mockApiService.get.mockResolvedValueOnce({
                data: {
                    type: 'carts',
                    id: 'cart123',
                    attributes: {
                        totals: { grandTotal: 1000 }
                    }
                },
                status: 200,
                statusText: 'OK',
                headers: {}
            });
            mockApiService.delete.mockResolvedValueOnce({
                data: {},
                status: 204,
                statusText: 'No Content',
                headers: {}
            });
            const result = await removeFromCartTool.handler({
                cartId: 'cart123',
                itemId: 'item456',
                token: 'token123'
            });
            expect(result.content?.[0]?.text).toContain('success');
        });
        it('should successfully update cart item', async () => {
            mockApiService.get.mockResolvedValueOnce({
                data: {
                    type: 'carts',
                    id: 'cart123',
                    attributes: {
                        totals: { grandTotal: 1000 }
                    }
                },
                status: 200,
                statusText: 'OK',
                headers: {}
            });
            mockApiService.patch.mockResolvedValueOnce({
                data: {
                    type: 'items',
                    id: 'item456',
                    attributes: {
                        quantity: 2
                    }
                },
                status: 200,
                statusText: 'OK',
                headers: {}
            });
            const result = await updateCartItemTool.handler({
                cartId: 'cart123',
                itemId: 'item456',
                quantity: 2,
                token: 'token123'
            });
            expect(result.content?.[0]?.text).toContain('success');
        });
        it('should successfully add to guest cart', async () => {
            mockApiService.post.mockResolvedValueOnce({
                data: {
                    type: 'guest-cart-items',
                    id: 'guest-item-123',
                    attributes: {
                        sku: 'TEST-SKU',
                        quantity: 1
                    }
                },
                status: 201,
                statusText: 'Created',
                headers: {}
            });
            const result = await guestAddToCartTool.handler({
                sku: 'TEST-SKU',
                quantity: 1,
                token: 'guest-token-123'
            });
            expect(result.content?.[0]?.text).toContain('success');
        });
    });
});
//# sourceMappingURL=cart-tools.test.js.map