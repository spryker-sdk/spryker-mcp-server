/**
 * Individual Tool Tests
 * Tests for specific tool implementations to improve coverage
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

// Mock logger
jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    getLevel: jest.fn(() => 'info'),
    setLevel: jest.fn(),
  }
}));

// Mock SprykerApiService
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../src/services/spryker-api.js', () => ({
  SprykerApiService: {
    getInstance: () => ({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      patch: mockPatch,
      delete: mockDelete,
    })
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, public status?: number, public statusText?: string, public responseData?: any) {
      super(message);
      this.name = 'ApiError';
    }
  }
}));

import { getCartTool } from '../../src/tools/get-cart.js';
import { getProductTool } from '../../src/tools/get-product.js';
import { addToCartTool } from '../../src/tools/add-to-cart.js';
import { removeFromCartTool } from '../../src/tools/remove-from-cart.js';
import { updateCartItemTool } from '../../src/tools/update-cart-item.js';
import { guestAddToCartTool } from '../../src/tools/guest-add-to-cart.js';
import { ApiError } from '../../src/services/spryker-api.js';

describe('Individual Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCartTool', () => {
    it('should get cart for authenticated user', async () => {
      const mockCartData = {
        id: 'cart-123',
        items: [{ sku: 'SKU-001', quantity: 2 }]
      };
      
      mockGet.mockResolvedValueOnce({
        status: 200,
        data: mockCartData
      });

      const result = await getCartTool.handler({
        token: 'customer-token',
        cartId: 'cart-123'
      });

      expect(mockGet).toHaveBeenCalledWith('carts/cart-123', 'customer-token');
      expect(result.content).toHaveLength(1);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": true');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"cart"');
    });

    it('should get cart for guest user', async () => {
      const mockCartData = {
        id: 'guest-cart-123',
        items: []
      };
      
      mockGet.mockResolvedValueOnce({
        status: 200,
        data: mockCartData
      });

      const result = await getCartTool.handler({
        token: 'guest-token-123',
        cartId: 'guest-cart-123'
      });

      expect(mockGet).toHaveBeenCalledWith('guest-carts/guest-cart-123', 'guest-token-123');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": true');
    });

    it('should get all carts when no cartId provided', async () => {
      const mockCartData = [
        { id: 'cart-1', items: [] },
        { id: 'cart-2', items: [] }
      ];
      
      mockGet.mockResolvedValueOnce({
        status: 200,
        data: mockCartData
      });

      const result = await getCartTool.handler({
        token: 'customer-token'
      });

      expect(mockGet).toHaveBeenCalledWith('carts', 'customer-token');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"totalCarts": 2');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": true');
    });

    it('should handle no carts found', async () => {
      mockGet.mockResolvedValueOnce({
        status: 200,
        data: []
      });

      const result = await getCartTool.handler({
        token: 'customer-token'
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"message": "No carts found"');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"carts": []');
    });

    it('should handle API errors', async () => {
      const apiError = new ApiError('Cart not found', 404, 'Not Found', { error: 'Cart not found' });
      mockGet.mockRejectedValueOnce(apiError);

      const result = await getCartTool.handler({
        token: 'customer-token',
        cartId: 'invalid-cart'
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": false');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"error": "Cart not found"');
    });
  });

  describe('addToCartTool', () => {
    it('should add item to cart', async () => {
      const mockCartData = [{ id: 'cart-123' }];
      const mockResponse = {
        status: 200,
        data: { id: 'item-123', sku: 'SKU-001', quantity: 2 }
      };
      
      // Mock GET carts to return existing cart
      mockGet.mockResolvedValueOnce({
        status: 200,
        data: mockCartData
      });
      
      // Mock POST cart items
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await addToCartTool.handler({
        sku: 'SKU-001',
        quantity: 2,
        token: 'customer-token'
      });

      expect(mockGet).toHaveBeenCalledWith('carts', 'customer-token');
      expect(mockPost).toHaveBeenCalledWith(
        'carts/cart-123/items',
        {
          data: {
            type: 'items',
            attributes: {
              sku: 'SKU-001',
              quantity: 2
            }
          }
        },
        'customer-token'
      );
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": true');
    });

    it('should handle API errors for add to cart', async () => {
      const apiError = new ApiError('Product not found', 404);
      // Mock GET carts failure
      mockGet.mockRejectedValueOnce(apiError);

      const result = await addToCartTool.handler({
        sku: 'invalid-sku',
        quantity: 1,
        token: 'customer-token'
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": false');
    });
  });

  describe('removeFromCartTool', () => {
    it('should remove item from cart', async () => {
      const mockResponse = {
        data: {
          id: 'cart-123',
          items: []
        }
      };
      
      mockDelete.mockResolvedValueOnce(mockResponse);

      const result = await removeFromCartTool.handler({
        token: 'customer-token',
        cartId: 'cart-123',
        itemId: 'item-456'
      });

      expect(mockDelete).toHaveBeenCalledWith(
        'carts/cart-123/items/item-456',
        'customer-token'
      );
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": true');
    });

    it('should handle errors for remove from cart', async () => {
      const apiError = new ApiError('Item not found', 404);
      mockDelete.mockRejectedValueOnce(apiError);

      const result = await removeFromCartTool.handler({
        token: 'customer-token',
        cartId: 'cart-123',
        itemId: 'invalid-item'
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": false');
    });
  });

  describe('updateCartItemTool', () => {
    it('should update cart item quantity', async () => {
      const mockResponse = {
        data: {
          id: 'cart-123',
          items: [{ id: 'item-456', sku: 'SKU-001', quantity: 5 }]
        }
      };
      
      mockPatch.mockResolvedValueOnce(mockResponse);

      const result = await updateCartItemTool.handler({
        token: 'customer-token',
        cartId: 'cart-123',
        itemId: 'item-456',
        quantity: 5
      });

      expect(mockPatch).toHaveBeenCalledWith(
        'carts/cart-123/items/item-456',
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'items',
            attributes: expect.objectContaining({
              quantity: 5
            })
          })
        }),
        'customer-token'
      );
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": true');
    });

    it('should handle errors for update cart item', async () => {
      const apiError = new ApiError('Item not found', 404);
      mockPatch.mockRejectedValueOnce(apiError);

      const result = await updateCartItemTool.handler({
        token: 'customer-token',
        cartId: 'cart-123',
        itemId: 'invalid-item',
        quantity: 3
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": false');
    });
  });

  describe('guestAddToCartTool', () => {
    it('should add item to guest cart', async () => {
      const mockResponse = {
        data: {
          id: 'guest-cart-123',
          items: [{ sku: 'SKU-001', quantity: 1 }]
        }
      };
      
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await guestAddToCartTool.handler({
        sku: 'SKU-001',
        quantity: 1,
        token: 'guest-123'
      });

      expect(mockPost).toHaveBeenCalledWith(
        'guest-cart-items',
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'guest-cart-items',
            attributes: expect.objectContaining({
              sku: 'SKU-001',
              quantity: 1
            })
          })
        }),
        'guest-123'
      );
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": true');
    });

    it('should handle errors for guest add to cart', async () => {
      const apiError = new ApiError('Guest cart not found', 404);
      mockPost.mockRejectedValueOnce(apiError);

      const result = await guestAddToCartTool.handler({
        sku: 'SKU-001',
        quantity: 1,
        token: 'guest-123'
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": false');
    });
  });

  describe('getProductTool', () => {
    it('should get product by concrete SKU', async () => {
      const mockResponseData = {
        data: {
          type: 'abstract-products',
          id: 'SKU-001',
          attributes: {
            sku: 'SKU-001',
            name: 'Test Product',
            description: 'Test Description',
            attributes: {},
            superAttributesDefinition: [],
            attributeMap: {},
            metaTitle: 'Test',
            metaKeywords: 'test',
            metaDescription: 'test',
            attributeNames: {},
            url: '/test-product'
          }
        },
        included: []
      };
      
      mockGet.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData
      });

      const result = await getProductTool.handler({
        sku: 'SKU-001'
      });

      expect(mockGet).toHaveBeenCalledWith('abstract-products/SKU-001?include=abstract-product-image-sets,abstract-product-availabilities,abstract-product-prices,category-nodes');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": true');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"name": "Test Product"');
    });

    it('should get product by abstract SKU when concrete fails', async () => {
      const mockResponseData = {
        data: {
          type: 'abstract-products',
          id: 'ABSTRACT-001',
          attributes: {
            sku: 'ABSTRACT-001',
            name: 'Abstract Test Product',
            description: 'Abstract Description',
            attributes: {},
            superAttributesDefinition: [],
            attributeMap: {},
            metaTitle: 'Abstract Test',
            metaKeywords: 'abstract test',
            metaDescription: 'abstract test',
            attributeNames: {},
            url: '/abstract-test-product'
          }
        },
        included: []
      };
      
      mockGet.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData
      });

      const result = await getProductTool.handler({
        sku: 'ABSTRACT-001'
      });

      expect(mockGet).toHaveBeenCalledWith('abstract-products/ABSTRACT-001?include=abstract-product-image-sets,abstract-product-availabilities,abstract-product-prices,category-nodes');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": true');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"name": "Abstract Test Product"');
    });

    it('should handle product not found', async () => {
      const apiError = new ApiError('Not found', 404);
      
      mockGet.mockRejectedValueOnce(apiError);

      const result = await getProductTool.handler({
        sku: 'INVALID-SKU'
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": false');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('Failed to retrieve product');
    });

    it('should handle API errors for get product', async () => {
      const apiError = new ApiError('Server error', 500);
      mockGet.mockRejectedValueOnce(apiError);

      const result = await getProductTool.handler({
        sku: 'SKU-001'
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('"success": false');
    });
  });

  describe('Tool schemas and exports', () => {
    it('should have proper tool definitions', () => {
      expect(getCartTool.name).toBe('get-cart');
      expect(getCartTool.description).toContain('cart');
      expect(getCartTool.inputSchema).toBeDefined();
      expect(typeof getCartTool.handler).toBe('function');

      expect(addToCartTool.name).toBe('add-to-cart');
      expect(addToCartTool.description).toContain('Add');
      expect(addToCartTool.inputSchema).toBeDefined();
      expect(typeof addToCartTool.handler).toBe('function');

      expect(removeFromCartTool.name).toBe('remove-from-cart');
      expect(removeFromCartTool.description).toContain('Remove');
      expect(removeFromCartTool.inputSchema).toBeDefined();
      expect(typeof removeFromCartTool.handler).toBe('function');

      expect(updateCartItemTool.name).toBe('update-cart-item');
      expect(updateCartItemTool.description).toContain('Update');
      expect(updateCartItemTool.inputSchema).toBeDefined();
      expect(typeof updateCartItemTool.handler).toBe('function');

      expect(guestAddToCartTool.name).toBe('guest-add-to-cart');
      expect(guestAddToCartTool.description).toContain('guest');
      expect(guestAddToCartTool.inputSchema).toBeDefined();
      expect(typeof guestAddToCartTool.handler).toBe('function');

      expect(getProductTool.name).toBe('get-product');
      expect(getProductTool.description).toContain('product');
      expect(getProductTool.inputSchema).toBeDefined();
      expect(typeof getProductTool.handler).toBe('function');
    });
  });
});
