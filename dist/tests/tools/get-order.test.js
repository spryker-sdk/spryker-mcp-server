/**
 * Tests for get-order tool
 */
import { getOrderTool } from '../../src/tools/get-order';
import { SprykerApiService } from '../../src/services/spryker-api';
import { logger } from '../../src/utils/logger';
// Mock dependencies
jest.mock('../../src/services/spryker-api');
jest.mock('../../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn()
    }
}));
describe('getOrderTool', () => {
    let mockApiService;
    beforeEach(() => {
        jest.clearAllMocks();
        mockApiService = {
            get: jest.fn()
        };
        SprykerApiService.getInstance.mockReturnValue(mockApiService);
    });
    describe('tool definition', () => {
        it('should have correct name and description', () => {
            expect(getOrderTool.name).toBe('get-order');
            expect(getOrderTool.description).toBe('Retrieve order details and history');
            expect(getOrderTool.inputSchema).toBeDefined();
            expect(getOrderTool.handler).toBeDefined();
        });
    });
    describe('handler', () => {
        const createApiResponse = (data) => ({
            data,
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' }
        });
        it('should retrieve specific order by reference', async () => {
            const mockOrderData = {
                data: {
                    type: 'orders',
                    id: '123',
                    attributes: {
                        orderReference: 'DE--123',
                        createdAt: '2023-01-01T00:00:00Z',
                        totals: {
                            expenseTotal: 100,
                            discountTotal: 10,
                            taxTotal: 20,
                            subtotal: 90,
                            grandTotal: 110
                        },
                        billingAddress: { city: 'Berlin' },
                        shippingAddress: { city: 'Munich' },
                        items: []
                    },
                    relationships: {
                        'order-items': {
                            data: [{ id: 'item1', type: 'order-items' }]
                        }
                    }
                },
                included: [
                    {
                        type: 'order-items',
                        id: 'item1',
                        attributes: {
                            name: 'Test Product',
                            quantity: 2,
                            unitPrice: 50,
                            sku: 'test-sku'
                        }
                    }
                ]
            };
            mockApiService.get.mockResolvedValue(createApiResponse(mockOrderData));
            const result = await getOrderTool.handler({
                token: 'customer-token',
                orderReference: 'DE--123'
            });
            expect(mockApiService.get).toHaveBeenCalledWith('orders/DE--123?include=order-items,product-concrete', 'customer-token');
            const responseData = JSON.parse(result.content?.[0]?.text || '{}');
            expect(responseData.success).toBe(true);
            expect(responseData.order.orderReference).toBe('DE--123');
        });
        it('should retrieve all orders when no order reference provided', async () => {
            const mockOrdersData = {
                data: [
                    {
                        type: 'orders',
                        id: '123',
                        attributes: {
                            orderReference: 'DE--123',
                            createdAt: '2023-01-01T00:00:00Z',
                            totals: {
                                expenseTotal: 100,
                                discountTotal: 10,
                                taxTotal: 20,
                                subtotal: 90,
                                grandTotal: 110
                            },
                            billingAddress: { city: 'Berlin' },
                            shippingAddress: { city: 'Munich' },
                            items: []
                        },
                        relationships: {}
                    }
                ],
                included: []
            };
            mockApiService.get.mockResolvedValue(createApiResponse(mockOrdersData));
            const result = await getOrderTool.handler({
                token: 'customer-token'
            });
            const responseData = JSON.parse(result.content?.[0]?.text || '{}');
            expect(responseData.success).toBe(true);
            expect(responseData.orders).toHaveLength(1);
            expect(responseData.totalOrders).toBe(1);
        });
        it('should handle empty order list', async () => {
            const mockEmptyData = {
                data: [],
                included: []
            };
            mockApiService.get.mockResolvedValue(createApiResponse(mockEmptyData));
            const result = await getOrderTool.handler({
                token: 'customer-token'
            });
            const responseData = JSON.parse(result.content?.[0]?.text || '{}');
            expect(responseData.success).toBe(true);
            expect(responseData.message).toBe('No orders found');
            expect(responseData.orders).toEqual([]);
        });
        it('should handle API errors', async () => {
            // Create an error that will properly have a message property
            const apiError = new Error('Order not found');
            Object.assign(apiError, {
                name: 'ApiError',
                status: 404,
                statusText: 'Not Found',
                responseData: []
            });
            mockApiService.get.mockRejectedValue(apiError);
            const result = await getOrderTool.handler({
                token: 'customer-token',
                orderReference: 'DE--123'
            });
            expect(logger.error).toHaveBeenCalledWith('Failed to retrieve order(s)', apiError);
            const responseData = JSON.parse(result.content?.[0]?.text || '{}');
            expect(responseData.success).toBe(false);
            expect(responseData.error).toBe('Failed to retrieve order(s)');
            expect(responseData.message).toBe('Order not found');
            expect(responseData.responseData).toEqual([]);
            expect(result.isError).toBe(true);
        });
        it('should handle generic errors', async () => {
            const genericError = new Error('Network error');
            mockApiService.get.mockRejectedValue(genericError);
            const result = await getOrderTool.handler({
                token: 'customer-token'
            });
            const responseData = JSON.parse(result.content?.[0]?.text || '{}');
            expect(responseData.success).toBe(false);
            expect(responseData.message).toBe('Network error');
        });
        it('should validate required token parameter', async () => {
            await expect(getOrderTool.handler({})).rejects.toThrow();
        });
        it('should validate token parameter type', async () => {
            await expect(getOrderTool.handler({ token: 123 })).rejects.toThrow();
        });
        it('should handle orders without relationships', async () => {
            const mockOrderData = {
                data: {
                    type: 'orders',
                    id: '123',
                    attributes: {
                        orderReference: 'DE--123',
                        createdAt: '2023-01-01T00:00:00Z',
                        totals: {
                            expenseTotal: 100,
                            discountTotal: 10,
                            taxTotal: 20,
                            subtotal: 90,
                            grandTotal: 110
                        },
                        billingAddress: { city: 'Berlin' },
                        shippingAddress: { city: 'Munich' },
                        items: []
                    }
                },
                included: []
            };
            mockApiService.get.mockResolvedValue(createApiResponse(mockOrderData));
            const result = await getOrderTool.handler({
                token: 'customer-token',
                orderReference: 'DE--123'
            });
            const responseData = JSON.parse(result.content?.[0]?.text || '{}');
            expect(responseData.success).toBe(true);
            expect(responseData.order.items).toEqual([]);
        });
    });
});
//# sourceMappingURL=get-order.test.js.map