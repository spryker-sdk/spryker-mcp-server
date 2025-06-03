import { jest } from '@jest/globals';
import { productSearchTool } from '../../src/tools/product-search.js';
import { ApiError } from '../../src/services/spryker-api.js';
// Mock the logger and config
jest.mock('../../src/utils/logger.js', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));
jest.mock('../../src/config/index.js', () => ({
    config: {
        server: {
            port: 3000
        },
        api: {
            baseUrl: 'https://api.example.com',
            defaultHeaders: { 'Content-Type': 'application/json' }
        }
    }
}));
// Mock the API service
const mockRequest = jest.fn();
jest.mock('../../src/services/spryker-api.js', () => {
    const actualModule = jest.requireActual('../../src/services/spryker-api.js');
    return {
        ...actualModule,
        SprykerApiService: {
            getInstance: jest.fn(() => ({
                request: mockRequest,
            })),
        },
        ApiError: actualModule.ApiError,
    };
});
describe('Product Search Tool', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('basic search', () => {
        it('should search products with query text', async () => {
            const mockResponse = {
                data: {
                    data: [{
                            type: 'catalog-search',
                            id: null,
                            attributes: {
                                abstractProducts: [
                                    {
                                        abstractSku: 'PROD001',
                                        abstractName: 'Test Product',
                                        price: 1999,
                                        prices: [{
                                                priceTypeName: 'DEFAULT',
                                                currency: { code: 'EUR', symbol: '€', name: 'Euro' },
                                                grossAmount: 1999
                                            }],
                                        images: [{ externalUrlSmall: 'small.jpg', externalUrlLarge: 'large.jpg' }]
                                    }
                                ],
                                pagination: {
                                    numFound: 1,
                                    currentPage: 1,
                                    maxPage: 1,
                                    currentItemsPerPage: 20
                                }
                            }
                        }]
                }
            };
            mockRequest.mockResolvedValueOnce(mockResponse);
            const result = await productSearchTool.handler({
                q: 'test',
                ipp: 20,
                page: 0
            });
            expect(mockRequest).toHaveBeenCalledWith('GET', 'catalog-search', {
                params: {
                    q: 'test',
                    ipp: '20',
                    page: '0'
                }
            });
            expect(result.content).toHaveLength(1);
            const response = JSON.parse(result.content[0].text);
            expect(response.products).toHaveLength(1);
            expect(response.products[0].sku).toBe('PROD001');
            expect(response.products[0].name).toBe('Test Product');
            expect(response.products[0].priceFormatted).toBe('19.99 €');
            expect(response.pagination.total).toBe(1);
        });
        it('should handle empty query as wildcard', async () => {
            const mockResponse = {
                data: {
                    data: [{
                            type: 'catalog-search',
                            id: null,
                            attributes: {
                                abstractProducts: [],
                                pagination: { numFound: 0, currentPage: 1, maxPage: 1, currentItemsPerPage: 20 }
                            }
                        }]
                }
            };
            mockRequest.mockResolvedValueOnce(mockResponse);
            await productSearchTool.handler({
                q: '*',
                ipp: 10
            });
            expect(mockRequest).toHaveBeenCalledWith('GET', 'catalog-search', {
                params: {
                    q: '',
                    ipp: '10',
                    page: '0'
                }
            });
        });
        it('should handle search without query parameter', async () => {
            const mockResponse = {
                data: {
                    data: [{
                            type: 'catalog-search',
                            id: null,
                            attributes: {
                                abstractProducts: [],
                                pagination: { numFound: 0, currentPage: 1, maxPage: 1, currentItemsPerPage: 20 }
                            }
                        }]
                }
            };
            mockRequest.mockResolvedValueOnce(mockResponse);
            await productSearchTool.handler({
                ipp: 5
            });
            expect(mockRequest).toHaveBeenCalledWith('GET', 'catalog-search', {
                params: {
                    q: '',
                    ipp: '5',
                    page: '0'
                }
            });
        });
    });
    describe('facet filters', () => {
        it('should handle value facets', async () => {
            const mockResponse = {
                data: {
                    data: [{
                            type: 'catalog-search',
                            id: null,
                            attributes: {
                                abstractProducts: [],
                                pagination: { numFound: 0, currentPage: 1, maxPage: 1, currentItemsPerPage: 20 },
                                valueFacets: [
                                    {
                                        name: 'brand',
                                        localizedName: 'Brand',
                                        values: [{ value: 'TestBrand', doc_count: 5 }],
                                        activeValue: 'TestBrand',
                                        config: { parameterName: 'brand', isMultiValued: false }
                                    }
                                ]
                            }
                        }]
                }
            };
            mockRequest.mockResolvedValueOnce(mockResponse);
            const result = await productSearchTool.handler({
                valueFacets: [
                    { name: 'brand', value: 'TestBrand' },
                    { name: 'category', value: 'electronics' }
                ]
            });
            expect(mockRequest).toHaveBeenCalledWith('GET', 'catalog-search', {
                params: {
                    q: '',
                    ipp: '20',
                    page: '0',
                    brand: 'TestBrand',
                    category: 'electronics'
                }
            });
            const response = JSON.parse(result.content[0].text);
            expect(response.valueFacets).toHaveLength(1);
            expect(response.valueFacets[0].name).toBe('brand');
        });
        it('should handle multiple values for the same facet', async () => {
            const mockResponse = {
                data: {
                    data: [{
                            type: 'catalog-search',
                            id: null,
                            attributes: {
                                abstractProducts: [],
                                pagination: { numFound: 0, currentPage: 1, maxPage: 1, currentItemsPerPage: 20 }
                            }
                        }]
                }
            };
            mockRequest.mockResolvedValueOnce(mockResponse);
            await productSearchTool.handler({
                valueFacets: [
                    { name: 'brand', value: 'Brand1' },
                    { name: 'brand', value: 'Brand2' }
                ]
            });
            expect(mockRequest).toHaveBeenCalledWith('GET', 'catalog-search', {
                params: {
                    q: '',
                    ipp: '20',
                    page: '0',
                    brand: ['Brand1', 'Brand2']
                }
            });
        });
        it('should handle range facets', async () => {
            const mockResponse = {
                data: {
                    data: [{
                            type: 'catalog-search',
                            id: null,
                            attributes: {
                                abstractProducts: [],
                                pagination: { numFound: 0, currentPage: 1, maxPage: 1, currentItemsPerPage: 20 },
                                rangeFacets: [
                                    {
                                        name: 'price',
                                        localizedName: 'Price',
                                        min: 0,
                                        max: 10000,
                                        activeMin: 1000,
                                        activeMax: 5000,
                                        docCount: 25,
                                        config: { parameterName: 'price', isMultiValued: false }
                                    }
                                ]
                            }
                        }]
                }
            };
            mockRequest.mockResolvedValueOnce(mockResponse);
            const result = await productSearchTool.handler({
                rangeFacets: [
                    { name: 'price', min: 1000, max: 5000 }
                ]
            });
            expect(mockRequest).toHaveBeenCalledWith('GET', 'catalog-search', {
                params: {
                    q: '',
                    ipp: '20',
                    page: '0',
                    'price[min]': '1000',
                    'price[max]': '5000'
                }
            });
            const response = JSON.parse(result.content[0].text);
            expect(response.rangeFacets).toHaveLength(1);
            expect(response.rangeFacets[0].name).toBe('price');
        });
        it('should handle range facets with only min or max', async () => {
            const mockResponse = {
                data: {
                    data: [{
                            type: 'catalog-search',
                            id: null,
                            attributes: {
                                abstractProducts: [],
                                pagination: { numFound: 0, currentPage: 1, maxPage: 1, currentItemsPerPage: 20 }
                            }
                        }]
                }
            };
            mockRequest.mockResolvedValueOnce(mockResponse);
            await productSearchTool.handler({
                rangeFacets: [
                    { name: 'price', min: 1000 },
                    { name: 'rating', max: 5 }
                ]
            });
            expect(mockRequest).toHaveBeenCalledWith('GET', 'catalog-search', {
                params: {
                    q: '',
                    ipp: '20',
                    page: '0',
                    'price[min]': '1000',
                    'rating[max]': '5'
                }
            });
        });
    });
    describe('sorting and pagination', () => {
        it('should handle sorting parameter', async () => {
            const mockResponse = {
                data: {
                    data: [{
                            type: 'catalog-search',
                            id: null,
                            attributes: {
                                abstractProducts: [],
                                pagination: { numFound: 0, currentPage: 1, maxPage: 1, currentItemsPerPage: 20 },
                                sort: {
                                    sortParamNames: ['relevance', 'price_asc', 'price_desc'],
                                    sortParamLocalizedNames: [{ 'en': 'Relevance' }, { 'en': 'Price ascending' }, { 'en': 'Price descending' }],
                                    currentSortParam: 'price_asc',
                                    currentSortOrder: 'asc'
                                }
                            }
                        }]
                }
            };
            mockRequest.mockResolvedValueOnce(mockResponse);
            const result = await productSearchTool.handler({
                sort: 'price_asc',
                ipp: 10,
                page: 2
            });
            expect(mockRequest).toHaveBeenCalledWith('GET', 'catalog-search', {
                params: {
                    q: '',
                    ipp: '10',
                    page: '2',
                    sort: 'price_asc'
                }
            });
            const response = JSON.parse(result.content[0].text);
            expect(response.sort.currentSortParam).toBe('price_asc');
            expect(response.pagination.page).toBe(2);
            expect(response.pagination.ipp).toBe(10);
        });
    });
    describe('error handling', () => {
        it('should handle no search results', async () => {
            const mockResponse = {
                data: {
                    data: []
                }
            };
            mockRequest.mockResolvedValueOnce(mockResponse);
            const result = await productSearchTool.handler({
                q: 'nonexistent'
            });
            expect(result.content).toHaveLength(1);
            const response = JSON.parse(result.content[0].text);
            expect(response.error).toBe('No search results found');
            expect(response.products).toEqual([]);
            expect(response.pagination.total).toBe(0);
        });
        it('should handle missing data property', async () => {
            const mockResponse = {
                data: {}
            };
            mockRequest.mockResolvedValueOnce(mockResponse);
            const result = await productSearchTool.handler({
                q: 'test'
            });
            expect(result.content).toHaveLength(1);
            const response = JSON.parse(result.content[0].text);
            expect(response.error).toBe('No search results found');
        });
        it('should handle invalid search result structure', async () => {
            const mockResponse = {
                data: {
                    data: [{ type: 'catalog-search', id: null }] // Missing attributes
                }
            };
            mockRequest.mockResolvedValueOnce(mockResponse);
            const result = await productSearchTool.handler({
                q: 'test'
            });
            expect(result.content).toHaveLength(1);
            const response = JSON.parse(result.content[0].text);
            expect(response.error).toBe('Invalid search result structure');
            expect(response.products).toEqual([]);
        });
        it('should handle API errors', async () => {
            const apiError = new ApiError('Search service unavailable', 503, undefined, { error: 'Service down' });
            mockRequest.mockRejectedValueOnce(apiError);
            const result = await productSearchTool.handler({
                q: 'test'
            });
            expect(result.content).toHaveLength(1);
            const response = JSON.parse(result.content[0].text);
            expect(response.error).toBe('Product search failed');
            expect(response.message).toBe('Search service unavailable');
            expect(response.products).toEqual([]);
            expect(response.responseData).toEqual({ error: 'Service down' });
        });
        it('should handle network errors', async () => {
            const networkError = new Error('Network timeout');
            mockRequest.mockRejectedValueOnce(networkError);
            const result = await productSearchTool.handler({
                q: 'test'
            });
            expect(result.content).toHaveLength(1);
            const response = JSON.parse(result.content[0].text);
            expect(response.error).toBe('Product search failed');
            expect(response.message).toBe('Network timeout');
            expect(response.responseData).toEqual([]);
        });
    });
    describe('product data formatting', () => {
        it('should format product prices correctly', async () => {
            const mockResponse = {
                data: {
                    data: [{
                            type: 'catalog-search',
                            id: null,
                            attributes: {
                                abstractProducts: [
                                    {
                                        abstractSku: 'PROD001',
                                        abstractName: 'Product with Prices',
                                        price: 2999,
                                        prices: [{
                                                priceTypeName: 'DEFAULT',
                                                currency: { code: 'USD', symbol: '$', name: 'Dollar' },
                                                grossAmount: 2999
                                            }]
                                    },
                                    {
                                        abstractSku: 'PROD002',
                                        abstractName: 'Product without Prices',
                                        price: 1500
                                        // No prices array
                                    }
                                ],
                                pagination: { numFound: 2, currentPage: 1, maxPage: 1, currentItemsPerPage: 20 }
                            }
                        }]
                }
            };
            mockRequest.mockResolvedValueOnce(mockResponse);
            const result = await productSearchTool.handler({ q: 'test' });
            const response = JSON.parse(result.content[0].text);
            expect(response.products).toHaveLength(2);
            expect(response.products[0].priceFormatted).toBe('29.99 $');
            expect(response.products[1].priceFormatted).toBe('15 EUR'); // Fallback
        });
        it('should handle products with missing optional fields', async () => {
            const mockResponse = {
                data: {
                    data: [{
                            type: 'catalog-search',
                            id: null,
                            attributes: {
                                abstractProducts: [
                                    {
                                        abstractSku: 'PROD001',
                                        abstractName: 'Minimal Product',
                                        price: 999
                                        // Missing prices and images
                                    }
                                ],
                                pagination: { numFound: 1, currentPage: 1, maxPage: 1, currentItemsPerPage: 20 }
                            }
                        }]
                }
            };
            mockRequest.mockResolvedValueOnce(mockResponse);
            const result = await productSearchTool.handler({ q: 'test' });
            const response = JSON.parse(result.content[0].text);
            expect(response.products).toHaveLength(1);
            expect(response.products[0].sku).toBe('PROD001');
            expect(response.products[0].name).toBe('Minimal Product');
            expect(response.products[0].price).toBe(999);
            expect(response.products[0].priceFormatted).toBe('9.99 EUR');
            expect(response.products[0].images).toBeUndefined();
        });
    });
    describe('tool configuration', () => {
        it('should have proper tool definition', () => {
            expect(productSearchTool.name).toBe('product-search');
            expect(productSearchTool.description).toContain('Search for abstract products');
            expect(typeof productSearchTool.handler).toBe('function');
            expect(productSearchTool.inputSchema).toBeDefined();
            expect(productSearchTool.inputSchema.type).toBe('object');
        });
        it('should validate input schema', async () => {
            await expect(productSearchTool.handler({
                ipp: -1 // Invalid - should be min 1
            })).rejects.toThrow();
            await expect(productSearchTool.handler({
                ipp: 101 // Invalid - should be max 100
            })).rejects.toThrow();
            await expect(productSearchTool.handler({
                page: -1 // Invalid - should be min 0
            })).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=product-search.test.js.map