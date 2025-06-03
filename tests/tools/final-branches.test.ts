/**
 * Final branch coverage tests for 75% tools to reach 80% overall
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
    constructor(message: string, public status?: number, public statusText?: string, public responseData?: unknown) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.statusText = statusText;
      this.responseData = responseData;
    }
  }
}));

import { guestAddToCartTool } from '../../src/tools/guest-add-to-cart.js';
import { removeFromCartTool } from '../../src/tools/remove-from-cart.js';
import { updateCartItemTool } from '../../src/tools/update-cart-item.js';
import { ApiError } from '../../src/services/spryker-api.js';

// Get reference to mocked API methods
const mockApiService = mockApiMethods;

describe('Final Branch Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('guestAddToCartTool additional branches', () => {
    it('should handle ApiError specifically in guestAddToCartTool', async () => {
      const apiError = new ApiError('Product not found', 404, 'Not Found', { error: 'product_not_found' });
      mockApiService.post.mockRejectedValueOnce(apiError);

      const result = await guestAddToCartTool.handler({
        sku: 'NONEXISTENT-SKU',
        quantity: 1,
        token: 'guest-token-123'
      });

      expect(result.content?.[0]?.text).toContain('success": false');
      expect(result.content?.[0]?.text).toContain('product_not_found');
    });
  });

  describe('removeFromCartTool additional branches', () => {
    it('should handle ApiError specifically in removeFromCartTool', async () => {
      const apiError = new ApiError('Cart not found', 404, 'Not Found', { error: 'cart_not_found' });
      mockApiService.delete.mockRejectedValueOnce(apiError);

      const result = await removeFromCartTool.handler({
        cartId: 'nonexistent-cart',
        itemId: 'item123',
        token: 'customer-token-123'
      });

      expect(result.content?.[0]?.text).toContain('success": false');
      expect(result.content?.[0]?.text).toContain('cart_not_found');
    });
  });

  describe('updateCartItemTool additional branches', () => {
    it('should handle ApiError specifically in updateCartItemTool', async () => {
      const apiError = new ApiError('Item not found', 404, 'Not Found', { error: 'item_not_found' });
      mockApiService.patch.mockRejectedValueOnce(apiError);

      const result = await updateCartItemTool.handler({
        cartId: 'cart123',
        itemId: 'nonexistent-item',
        quantity: 2,
        token: 'customer-token-123'
      });

      expect(result.content?.[0]?.text).toContain('success": false');
      expect(result.content?.[0]?.text).toContain('item_not_found');
    });
  });

  describe('error handling branches', () => {
    it('should handle non-Error objects in guestAddToCartTool', async () => {
      mockApiService.post.mockRejectedValueOnce('String error');

      const result = await guestAddToCartTool.handler({
        sku: 'TEST-SKU',
        quantity: 1,
        token: 'guest-token-123'
      });

      expect(result.content?.[0]?.text).toContain('success": false');
    });

    it('should handle non-Error objects in removeFromCartTool', async () => {
      mockApiService.delete.mockRejectedValueOnce('String error');

      const result = await removeFromCartTool.handler({
        cartId: 'cart123',
        itemId: 'item123',
        token: 'customer-token-123'
      });

      expect(result.content?.[0]?.text).toContain('success": false');
      expect(result.content?.[0]?.text).toContain('Unknown error occurred');
    });

    it('should handle non-Error objects in updateCartItemTool', async () => {
      mockApiService.patch.mockRejectedValueOnce('String error');

      const result = await updateCartItemTool.handler({
        cartId: 'cart123',
        itemId: 'item123',
        quantity: 2,
        token: 'customer-token-123'
      });

      expect(result.content?.[0]?.text).toContain('success": false');
      expect(result.content?.[0]?.text).toContain('Unknown error occurred');
    });
  });
});
