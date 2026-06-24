/**
 * Test for Get Product Prices Tool
 */

import { getProductPricesTool } from '../../src/tools/get-product-prices';
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

describe('getProductPricesTool', () => {
  it('should have correct name and schema', () => {
    expect(getProductPricesTool.name).toBe('get-product-prices');
    expect(getProductPricesTool.inputSchema.properties.sku).toBeDefined();
  });

  it('should default to abstract prices', async () => {
    mockApiService.get.mockResolvedValue({
      status: 200,
      data: { data: [{ type: 'abstract-product-prices', id: 'p-1', attributes: { price: 1000 } }] },
    });

    const result = await getProductPricesTool.handler({ sku: 'ABSTRACT-1' });

    expect(mockApiService.get).toHaveBeenCalledWith('abstract-products/ABSTRACT-1/abstract-product-prices');
    const response = JSON.parse(result.content[0]!.text);
    expect(response.success).toBe(true);
    expect(response.prices).toHaveLength(1);
  });

  it('should query concrete prices and wrap a single object', async () => {
    mockApiService.get.mockResolvedValue({
      status: 200,
      data: { data: { type: 'concrete-product-prices', id: 'p-2', attributes: { price: 2000 } } },
    });

    const result = await getProductPricesTool.handler({ sku: 'CONCRETE-1', productType: 'concrete' });

    expect(mockApiService.get).toHaveBeenCalledWith('concrete-products/CONCRETE-1/concrete-product-prices');
    const response = JSON.parse(result.content[0]!.text);
    expect(response.prices).toHaveLength(1);
  });

  it('should handle null data', async () => {
    mockApiService.get.mockResolvedValue({ status: 200, data: { data: null } });
    const result = await getProductPricesTool.handler({ sku: 'X' });
    expect(JSON.parse(result.content[0]!.text).prices).toHaveLength(0);
  });

  it('should handle non-Error rejection', async () => {
    mockApiService.get.mockRejectedValue('string error');
    const result = await getProductPricesTool.handler({ sku: 'X' });
    expect('isError' in result && result.isError).toBe(true);
    expect(JSON.parse(result.content[0]!.text).message).toBe('Unknown error occurred');
  });

  it('should validate input', async () => {
    await expect(getProductPricesTool.handler({})).rejects.toThrow();
  });
});
