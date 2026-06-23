/**
 * Test for Get Product Availability Tool
 */

import { getProductAvailabilityTool } from '../../src/tools/get-product-availability';
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

describe('getProductAvailabilityTool', () => {
  it('should have correct name and schema', () => {
    expect(getProductAvailabilityTool.name).toBe('get-product-availability');
    expect(getProductAvailabilityTool.inputSchema.properties.sku).toBeDefined();
  });

  it('should default to abstract availability', async () => {
    mockApiService.get.mockResolvedValue({
      status: 200,
      data: { data: [{ type: 'abstract-product-availabilities', id: 'a-1', attributes: { availability: true } }] },
    });

    const result = await getProductAvailabilityTool.handler({ sku: 'ABSTRACT-1' });

    expect(mockApiService.get).toHaveBeenCalledWith('abstract-products/ABSTRACT-1/abstract-product-availabilities');
    const response = JSON.parse(result.content[0]!.text);
    expect(response.success).toBe(true);
    expect(response.productType).toBe('abstract');
    expect(response.availability).toHaveLength(1);
  });

  it('should query concrete availability and wrap a single object', async () => {
    mockApiService.get.mockResolvedValue({
      status: 200,
      data: { data: { type: 'concrete-product-availabilities', id: 'c-1', attributes: { availability: false } } },
    });

    const result = await getProductAvailabilityTool.handler({ sku: 'CONCRETE-1', productType: 'concrete' });

    expect(mockApiService.get).toHaveBeenCalledWith('concrete-products/CONCRETE-1/concrete-product-availabilities');
    const response = JSON.parse(result.content[0]!.text);
    expect(response.availability).toHaveLength(1);
  });

  it('should handle null data', async () => {
    mockApiService.get.mockResolvedValue({ status: 200, data: { data: null } });
    const result = await getProductAvailabilityTool.handler({ sku: 'X' });
    const response = JSON.parse(result.content[0]!.text);
    expect(response.availability).toHaveLength(0);
  });

  it('should handle ApiError with response data', async () => {
    mockApiService.get.mockRejectedValue(new ApiError('boom', 500, 'Server Error', { detail: 'x' }));
    const result = await getProductAvailabilityTool.handler({ sku: 'X' });
    expect('isError' in result && result.isError).toBe(true);
    const response = JSON.parse(result.content[0]!.text);
    expect(response.success).toBe(false);
    expect(response.responseData).toEqual({ detail: 'x' });
  });

  it('should validate input', async () => {
    await expect(getProductAvailabilityTool.handler({})).rejects.toThrow();
  });
});
