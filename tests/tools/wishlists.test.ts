/**
 * Tests for wishlist tools: get-wishlists, create-wishlist, add-to-wishlist, wishlist-to-cart
 */

import { getWishlistsTool } from '../../src/tools/get-wishlists';
import { createWishlistTool } from '../../src/tools/create-wishlist';
import { addToWishlistTool } from '../../src/tools/add-to-wishlist';
import { wishlistToCartTool } from '../../src/tools/wishlist-to-cart';
import { SprykerApiService } from '../../src/services/spryker-api';
import { logger } from '../../src/utils/logger';

jest.mock('../../src/utils/logger');

jest.mock('../../src/services/spryker-api', () => {
  const originalModule = jest.requireActual('../../src/services/spryker-api');
  return {
    ...originalModule,
    SprykerApiService: { getInstance: jest.fn() },
  };
});

const { ApiError } = jest.requireActual('../../src/services/spryker-api');

const mockApiService = { get: jest.fn(), post: jest.fn() };
const mockLogger = logger as any;

beforeEach(() => {
  jest.clearAllMocks();
  (SprykerApiService.getInstance as jest.Mock).mockReturnValue(mockApiService);
  mockLogger.info = jest.fn();
  mockLogger.error = jest.fn();
});

describe('getWishlistsTool', () => {
  it('should list all wishlists', async () => {
    mockApiService.get.mockResolvedValue({
      status: 200,
      data: { data: [{ type: 'wishlists', id: 'w1', attributes: { name: 'Birthday' } }] },
    });

    const result = await getWishlistsTool.handler({ token: 'auth' });

    expect(mockApiService.get).toHaveBeenCalledWith('wishlists', 'auth');
    const response = JSON.parse(result.content[0]!.text);
    expect(response.wishlists).toHaveLength(1);
    expect(response.items).toHaveLength(0);
  });

  it('should get a single wishlist with items', async () => {
    mockApiService.get.mockResolvedValue({
      status: 200,
      data: {
        data: { type: 'wishlists', id: 'w1', attributes: { name: 'Birthday' } },
        included: [{ type: 'wishlist-items', id: 'i1', attributes: { sku: 'SKU-1' } }],
      },
    });

    const result = await getWishlistsTool.handler({ token: 'auth', wishlistUuid: 'w1' });

    expect(mockApiService.get).toHaveBeenCalledWith('wishlists/w1?include=wishlist-items', 'auth');
    const response = JSON.parse(result.content[0]!.text);
    expect(response.wishlists).toHaveLength(1);
    expect(response.items).toHaveLength(1);
  });

  it('should handle null data', async () => {
    mockApiService.get.mockResolvedValue({ status: 200, data: { data: null } });
    const result = await getWishlistsTool.handler({ token: 'auth' });
    expect(JSON.parse(result.content[0]!.text).wishlists).toHaveLength(0);
  });

  it('should handle ApiError', async () => {
    mockApiService.get.mockRejectedValue(new ApiError('x', 401, 'Unauthorized', ['nope']));
    const result = await getWishlistsTool.handler({ token: 'auth' });
    expect('isError' in result && result.isError).toBe(true);
    expect(JSON.parse(result.content[0]!.text).responseData).toEqual(['nope']);
  });

  it('should validate input', async () => {
    await expect(getWishlistsTool.handler({})).rejects.toThrow();
  });
});

describe('createWishlistTool', () => {
  it('should create a wishlist', async () => {
    mockApiService.post.mockResolvedValue({ status: 201, data: { data: { id: 'w2' } } });
    const result = await createWishlistTool.handler({ token: 'auth', name: 'Holiday' });
    expect(mockApiService.post).toHaveBeenCalledWith(
      'wishlists',
      { data: { type: 'wishlists', attributes: { name: 'Holiday' } } },
      'auth'
    );
    expect(JSON.parse(result.content[0]!.text).success).toBe(true);
  });

  it('should handle non-Error rejection', async () => {
    mockApiService.post.mockRejectedValue('boom');
    const result = await createWishlistTool.handler({ token: 'auth', name: 'Holiday' });
    expect('isError' in result && result.isError).toBe(true);
    expect(JSON.parse(result.content[0]!.text).message).toBe('Unknown error occurred');
  });

  it('should validate input', async () => {
    await expect(createWishlistTool.handler({ token: 'auth' })).rejects.toThrow();
  });
});

describe('addToWishlistTool', () => {
  it('should add an item to a wishlist', async () => {
    mockApiService.post.mockResolvedValue({ status: 201, data: { data: { id: 'i1' } } });
    const result = await addToWishlistTool.handler({ token: 'auth', wishlistUuid: 'w1', sku: 'SKU-1' });
    expect(mockApiService.post).toHaveBeenCalledWith(
      'wishlists/w1/wishlist-items',
      { data: { type: 'wishlist-items', attributes: { sku: 'SKU-1' } } },
      'auth'
    );
    expect(JSON.parse(result.content[0]!.text).success).toBe(true);
  });

  it('should handle ApiError', async () => {
    mockApiService.post.mockRejectedValue(new ApiError('x', 404, 'Not Found', ['missing']));
    const result = await addToWishlistTool.handler({ token: 'auth', wishlistUuid: 'w1', sku: 'SKU-1' });
    expect(JSON.parse(result.content[0]!.text).responseData).toEqual(['missing']);
  });

  it('should validate input', async () => {
    await expect(addToWishlistTool.handler({ token: 'auth', wishlistUuid: 'w1' })).rejects.toThrow();
  });
});

describe('wishlistToCartTool', () => {
  it('should move all wishlist items into the cart', async () => {
    mockApiService.get.mockResolvedValue({
      status: 200,
      data: {
        included: [
          { type: 'wishlist-items', id: 'i1', attributes: { sku: 'SKU-1' } },
          { type: 'wishlist-items', id: 'i2', attributes: { sku: 'SKU-2' } },
          { type: 'other', id: 'x', attributes: {} },
        ],
      },
    });
    mockApiService.post.mockResolvedValue({ status: 201, data: {} });

    const result = await wishlistToCartTool.handler({ token: 'auth', wishlistUuid: 'w1', cartId: 'c1' });

    expect(mockApiService.get).toHaveBeenCalledWith('wishlists/w1?include=wishlist-items', 'auth');
    expect(mockApiService.post).toHaveBeenCalledTimes(2);
    const response = JSON.parse(result.content[0]!.text);
    expect(response.success).toBe(true);
    expect(response.added).toEqual(['SKU-1', 'SKU-2']);
    expect(response.failed).toHaveLength(0);
  });

  it('should report partial failures', async () => {
    mockApiService.get.mockResolvedValue({
      status: 200,
      data: { included: [{ type: 'wishlist-items', id: 'i1', attributes: { sku: 'SKU-1' } }] },
    });
    mockApiService.post.mockRejectedValue(new Error('out of stock'));

    const result = await wishlistToCartTool.handler({ token: 'auth', wishlistUuid: 'w1', cartId: 'c1' });

    expect('isError' in result && result.isError).toBe(true);
    const response = JSON.parse(result.content[0]!.text);
    expect(response.success).toBe(false);
    expect(response.failed).toHaveLength(1);
    expect(response.failed[0].message).toBe('out of stock');
  });

  it('should handle empty wishlist (no included)', async () => {
    mockApiService.get.mockResolvedValue({ status: 200, data: {} });
    const result = await wishlistToCartTool.handler({ token: 'auth', wishlistUuid: 'w1', cartId: 'c1' });
    const response = JSON.parse(result.content[0]!.text);
    expect(response.success).toBe(true);
    expect(response.added).toHaveLength(0);
  });

  it('should handle wishlist fetch failure', async () => {
    mockApiService.get.mockRejectedValue(new ApiError('x', 500, 'Server Error', ['oops']));
    const result = await wishlistToCartTool.handler({ token: 'auth', wishlistUuid: 'w1', cartId: 'c1' });
    expect('isError' in result && result.isError).toBe(true);
    expect(JSON.parse(result.content[0]!.text).responseData).toEqual(['oops']);
  });

  it('should validate input', async () => {
    await expect(wishlistToCartTool.handler({ token: 'auth', wishlistUuid: 'w1' })).rejects.toThrow();
  });
});
