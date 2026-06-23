/**
 * Test for Get Product Reviews Tool
 */

import { getProductReviewsTool } from '../../src/tools/get-product-reviews';
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

const mockApiService = { get: jest.fn() };
const mockLogger = logger as any;

beforeEach(() => {
  jest.clearAllMocks();
  (SprykerApiService.getInstance as jest.Mock).mockReturnValue(mockApiService);
  mockLogger.info = jest.fn();
  mockLogger.error = jest.fn();
});

describe('getProductReviewsTool', () => {
  it('should have correct name and schema', () => {
    expect(getProductReviewsTool.name).toBe('get-product-reviews');
    expect(getProductReviewsTool.inputSchema.properties.sku).toBeDefined();
  });

  it('should retrieve reviews', async () => {
    mockApiService.get.mockResolvedValue({
      status: 200,
      data: {
        data: [
          { type: 'product-reviews', id: 'r-1', attributes: { rating: 5, summary: 'Great' } },
          { type: 'product-reviews', id: 'r-2', attributes: { rating: 4, summary: 'Good' } },
        ],
      },
    });

    const result = await getProductReviewsTool.handler({ sku: 'ABSTRACT-1' });

    expect(mockApiService.get).toHaveBeenCalledWith('abstract-products/ABSTRACT-1/product-reviews');
    const response = JSON.parse(result.content[0]!.text);
    expect(response.success).toBe(true);
    expect(response.count).toBe(2);
    expect(response.reviews).toHaveLength(2);
  });

  it('should handle non-array data', async () => {
    mockApiService.get.mockResolvedValue({ status: 200, data: { data: null } });
    const result = await getProductReviewsTool.handler({ sku: 'X' });
    const response = JSON.parse(result.content[0]!.text);
    expect(response.count).toBe(0);
  });

  it('should handle ApiError', async () => {
    mockApiService.get.mockRejectedValue(new ApiError('nope', 404, 'Not Found'));
    const result = await getProductReviewsTool.handler({ sku: 'X' });
    expect('isError' in result && result.isError).toBe(true);
    expect(JSON.parse(result.content[0]!.text).success).toBe(false);
  });

  it('should handle non-Error rejection', async () => {
    mockApiService.get.mockRejectedValue('string error');
    const result = await getProductReviewsTool.handler({ sku: 'X' });
    expect('isError' in result && result.isError).toBe(true);
    expect(JSON.parse(result.content[0]!.text).message).toBe('Unknown error occurred');
  });

  it('should validate input', async () => {
    await expect(getProductReviewsTool.handler({})).rejects.toThrow();
  });
});
