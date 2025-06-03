/**
 * Test for Get Product Tool
 */
import { getProductTool } from '../../src/tools/get-product';
import { SprykerApiService } from '../../src/services/spryker-api';
import { logger } from '../../src/utils/logger';
// Mock dependencies selectively
jest.mock('../../src/utils/logger');
// Partial mock for SprykerApiService to keep ApiError class intact
jest.mock('../../src/services/spryker-api', () => {
    const originalModule = jest.requireActual('../../src/services/spryker-api');
    return {
        ...originalModule,
        SprykerApiService: {
            getInstance: jest.fn(),
        },
    };
});
// Import ApiError after setting up the mock
const { ApiError } = jest.requireActual('../../src/services/spryker-api');
const mockApiService = {
    get: jest.fn()
};
const mockLogger = logger;
beforeEach(() => {
    jest.clearAllMocks();
    // Mock SprykerApiService
    SprykerApiService.getInstance.mockReturnValue(mockApiService);
    // Mock logger
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();
});
describe('getProductTool', () => {
    const validArgs = {
        sku: 'PROD-123'
    };
    const mockProductResponse = {
        status: 200,
        data: {
            data: {
                type: 'abstract-products',
                id: 'PROD-123',
                attributes: {
                    sku: 'PROD-123',
                    name: 'Test Product',
                    description: 'A test product description',
                    attributes: {
                        color: 'blue',
                        size: 'large'
                    },
                    superAttributesDefinition: ['color', 'size'],
                    attributeMap: {
                        'blue::large': 'concrete-sku-1'
                    },
                    metaTitle: 'Test Product Title',
                    metaKeywords: 'test, product',
                    metaDescription: 'Test product meta description',
                    attributeNames: {
                        color: 'Color',
                        size: 'Size'
                    },
                    url: '/test-product'
                },
                relationships: {
                    'abstract-product-image-sets': {
                        data: [{ type: 'abstract-product-image-sets', id: 'img-1' }]
                    },
                    'abstract-product-availabilities': {
                        data: [{ type: 'abstract-product-availabilities', id: 'avail-1' }]
                    },
                    'abstract-product-prices': {
                        data: [{ type: 'abstract-product-prices', id: 'price-1' }]
                    },
                    'category-nodes': {
                        data: [{ type: 'category-nodes', id: 'cat-1' }]
                    }
                }
            },
            included: [
                {
                    type: 'abstract-product-image-sets',
                    id: 'img-1',
                    attributes: {
                        name: 'default',
                        imageSets: []
                    }
                },
                {
                    type: 'abstract-product-availabilities',
                    id: 'avail-1',
                    attributes: {
                        availability: true,
                        quantity: 10
                    }
                },
                {
                    type: 'abstract-product-prices',
                    id: 'price-1',
                    attributes: {
                        price: 1999,
                        priceTypeName: 'DEFAULT'
                    }
                },
                {
                    type: 'category-nodes',
                    id: 'cat-1',
                    attributes: {
                        nodeId: 5,
                        name: 'Electronics'
                    }
                }
            ]
        }
    };
    describe('tool metadata', () => {
        it('should have correct name and description', () => {
            expect(getProductTool.name).toBe('get-product');
            expect(getProductTool.description).toContain('Get detailed abstract product information');
        });
        it('should have valid input schema', () => {
            expect(getProductTool.inputSchema).toBeDefined();
            expect(getProductTool.inputSchema.type).toBe('object');
            expect(getProductTool.inputSchema.properties.sku).toBeDefined();
        });
    });
    describe('handler', () => {
        it('should successfully retrieve product details', async () => {
            mockApiService.get.mockResolvedValue(mockProductResponse);
            const result = await getProductTool.handler(validArgs);
            expect(mockApiService.get).toHaveBeenCalledWith('abstract-products/PROD-123?include=abstract-product-image-sets,abstract-product-availabilities,abstract-product-prices,category-nodes');
            expect(mockLogger.info).toHaveBeenCalledWith('Retrieving product details', { sku: 'PROD-123' });
            expect(result.content).toHaveLength(1);
            expect(result.content[0]?.type).toBe('text');
            const response = JSON.parse(result.content[0].text);
            expect(response.success).toBe(true);
            expect(response.message).toBe('Product retrieved successfully');
            expect(response.product.sku).toBe('PROD-123');
            expect(response.product.name).toBe('Test Product');
            expect(response.product.attributes.color).toBe('blue');
            expect(response.images).toHaveLength(1);
            expect(response.availability).toHaveLength(1);
            expect(response.prices).toHaveLength(1);
            expect(response.categories).toHaveLength(1);
        });
        it('should handle product not found', async () => {
            const apiError = new ApiError('Product not found', 404, 'Not Found');
            mockApiService.get.mockRejectedValue(apiError);
            const result = await getProductTool.handler(validArgs);
            expect(mockLogger.error).toHaveBeenCalledWith('Get product failed', apiError);
            expect(result.content).toHaveLength(1);
            expect('isError' in result && result.isError).toBe(true);
            const response = JSON.parse(result.content[0].text);
            expect(response.success).toBe(false);
            expect(response.error).toBe('Failed to retrieve product');
            expect(response.message).toBe('Product not found');
            expect(response.sku).toBe('PROD-123');
        });
        it('should handle API service errors', async () => {
            const networkError = new Error('Network error');
            mockApiService.get.mockRejectedValue(networkError);
            const result = await getProductTool.handler(validArgs);
            expect(mockLogger.error).toHaveBeenCalledWith('Get product failed', networkError);
            expect(result.content).toHaveLength(1);
            expect('isError' in result && result.isError).toBe(true);
            const response = JSON.parse(result.content[0].text);
            expect(response.success).toBe(false);
            expect(response.error).toBe('Failed to retrieve product');
            expect(response.message).toBe('Network error');
        });
        it('should handle product response without included data', async () => {
            const responseWithoutIncluded = {
                ...mockProductResponse,
                data: {
                    ...mockProductResponse.data,
                    included: undefined
                }
            };
            mockApiService.get.mockResolvedValue(responseWithoutIncluded);
            const result = await getProductTool.handler(validArgs);
            expect(result.content).toHaveLength(1);
            const response = JSON.parse(result.content[0].text);
            expect(response.success).toBe(true);
            expect(response.images).toHaveLength(0);
            expect(response.availability).toHaveLength(0);
            expect(response.prices).toHaveLength(0);
            expect(response.categories).toHaveLength(0);
        });
        it('should handle non-Error exceptions', async () => {
            mockApiService.get.mockRejectedValue('String error');
            const result = await getProductTool.handler(validArgs);
            expect(result.content).toHaveLength(1);
            expect('isError' in result && result.isError).toBe(true);
            const response = JSON.parse(result.content[0].text);
            expect(response.success).toBe(false);
            expect(response.message).toBe('Unknown error occurred');
        });
        it('should validate input arguments', async () => {
            const invalidArgs = { sku: 123 }; // Should be string
            await expect(getProductTool.handler(invalidArgs)).rejects.toThrow();
        });
        it('should handle missing sku', async () => {
            const invalidArgs = {};
            await expect(getProductTool.handler(invalidArgs)).rejects.toThrow();
        });
        it('should handle ApiError with response data', async () => {
            const apiError = new ApiError('Invalid SKU format', 400, 'Bad Request', ['Invalid SKU']);
            mockApiService.get.mockRejectedValue(apiError);
            const result = await getProductTool.handler(validArgs);
            expect(result.content).toHaveLength(1);
            expect('isError' in result && result.isError).toBe(true);
            const response = JSON.parse(result.content[0].text);
            expect(response.success).toBe(false);
            expect(response.responseData).toEqual(['Invalid SKU']);
        });
        it('should handle partial included data', async () => {
            const partialResponse = {
                ...mockProductResponse,
                data: {
                    ...mockProductResponse.data,
                    included: [
                        {
                            type: 'abstract-product-image-sets',
                            id: 'img-1',
                            attributes: { name: 'default' }
                        },
                        {
                            type: 'some-other-type',
                            id: 'other-1',
                            attributes: { data: 'test' }
                        }
                    ]
                }
            };
            mockApiService.get.mockResolvedValue(partialResponse);
            const result = await getProductTool.handler(validArgs);
            expect(result.content).toHaveLength(1);
            const response = JSON.parse(result.content[0].text);
            expect(response.success).toBe(true);
            expect(response.images).toHaveLength(1);
            expect(response.availability).toHaveLength(0);
            expect(response.prices).toHaveLength(0);
            expect(response.categories).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=get-product.test.js.map