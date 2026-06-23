/**
 * Test for Get Concrete Product Tool
 */
import { getConcreteProductTool } from '../../src/tools/get-concrete-product';
import { SprykerApiService } from '../../src/services/spryker-api';
import { logger } from '../../src/utils/logger';
jest.mock('../../src/utils/logger');
jest.mock('../../src/services/spryker-api', () => {
    const originalModule = jest.requireActual('../../src/services/spryker-api');
    return {
        ...originalModule,
        SprykerApiService: {
            getInstance: jest.fn(),
        },
    };
});
const { ApiError } = jest.requireActual('../../src/services/spryker-api');
const mockApiService = {
    get: jest.fn(),
};
const mockLogger = logger;
beforeEach(() => {
    jest.clearAllMocks();
    SprykerApiService.getInstance.mockReturnValue(mockApiService);
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();
});
describe('getConcreteProductTool', () => {
    const validArgs = { sku: 'CONCRETE-1' };
    const mockResponse = {
        status: 200,
        data: {
            data: {
                type: 'concrete-products',
                id: 'CONCRETE-1',
                attributes: {
                    sku: 'CONCRETE-1',
                    name: 'Concrete Variant',
                    description: 'A concrete variant',
                    attributes: { color: 'red' },
                    superAttributes: { color: 'red' },
                    productAbstractSku: 'ABSTRACT-1',
                },
            },
            included: [
                { type: 'concrete-product-image-sets', id: 'img-1', attributes: { name: 'default' } },
                { type: 'concrete-product-availabilities', id: 'avail-1', attributes: { availability: true } },
                { type: 'concrete-product-prices', id: 'price-1', attributes: { price: 1999 } },
            ],
        },
    };
    describe('tool metadata', () => {
        it('should have correct name and schema', () => {
            expect(getConcreteProductTool.name).toBe('get-concrete-product');
            expect(getConcreteProductTool.inputSchema.type).toBe('object');
            expect(getConcreteProductTool.inputSchema.properties.sku).toBeDefined();
        });
    });
    describe('handler', () => {
        it('should retrieve concrete product details', async () => {
            mockApiService.get.mockResolvedValue(mockResponse);
            const result = await getConcreteProductTool.handler(validArgs);
            expect(mockApiService.get).toHaveBeenCalledWith('concrete-products/CONCRETE-1?include=concrete-product-image-sets,concrete-product-availabilities,concrete-product-prices');
            const response = JSON.parse(result.content[0].text);
            expect(response.success).toBe(true);
            expect(response.product.sku).toBe('CONCRETE-1');
            expect(response.product.productAbstractSku).toBe('ABSTRACT-1');
            expect(response.images).toHaveLength(1);
            expect(response.availability).toHaveLength(1);
            expect(response.prices).toHaveLength(1);
        });
        it('should handle response without included data', async () => {
            mockApiService.get.mockResolvedValue({ ...mockResponse, data: { ...mockResponse.data, included: undefined } });
            const result = await getConcreteProductTool.handler(validArgs);
            const response = JSON.parse(result.content[0].text);
            expect(response.success).toBe(true);
            expect(response.images).toHaveLength(0);
        });
        it('should handle ApiError with response data', async () => {
            mockApiService.get.mockRejectedValue(new ApiError('Not found', 404, 'Not Found', ['missing']));
            const result = await getConcreteProductTool.handler(validArgs);
            expect('isError' in result && result.isError).toBe(true);
            const response = JSON.parse(result.content[0].text);
            expect(response.success).toBe(false);
            expect(response.responseData).toEqual(['missing']);
        });
        it('should handle non-Error rejection', async () => {
            mockApiService.get.mockRejectedValue('string error');
            const result = await getConcreteProductTool.handler(validArgs);
            expect('isError' in result && result.isError).toBe(true);
            expect(JSON.parse(result.content[0].text).message).toBe('Unknown error occurred');
        });
        it('should validate input arguments', async () => {
            await expect(getConcreteProductTool.handler({ sku: 123 })).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=get-concrete-product.test.js.map