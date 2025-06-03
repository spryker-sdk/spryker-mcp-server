import { jest } from '@jest/globals';
import { getCheckoutDataTool } from '../../src/tools/get-checkout-data.js';
import { SprykerApiService, ApiError } from '../../src/services/spryker-api.js';

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
const mockPost = jest.fn() as jest.MockedFunction<any>;

jest.mock('../../src/services/spryker-api.js', () => {
  const actualModule = jest.requireActual('../../src/services/spryker-api.js') as any;
  return {
    ...actualModule,
    SprykerApiService: {
      getInstance: jest.fn(() => ({
        post: mockPost,
      })),
    },
    ApiError: actualModule.ApiError,
  };
});

describe('Get Checkout Data Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful data retrieval', () => {
    it('should retrieve checkout data with all included information', async () => {
      const mockResponse = {
        data: {
          data: {
            type: 'checkout-data',
            id: 'checkout-123',
            attributes: {
              idCart: 'cart-123',
              currencyIsoCode: 'EUR',
              priceMode: 'GROSS_MODE',
              store: 'DE'
            },
            relationships: {
              'payment-methods': { data: [{ type: 'payment-methods', id: '1' }] },
              'shipment-methods': { data: [{ type: 'shipment-methods', id: '1' }] }
            }
          },
          included: [
            {
              type: 'payment-methods',
              id: '1',
              attributes: {
                name: 'Invoice',
                provider: 'DummyPayment',
                isSelected: true
              }
            },
            {
              type: 'payment-methods',
              id: '2',
              attributes: {
                name: 'Credit Card',
                provider: 'Stripe',
                isSelected: false
              }
            },
            {
              type: 'shipment-methods',
              id: '1',
              attributes: {
                name: 'Standard Shipping',
                carrier: 'DHL',
                deliveryTime: '3-5 days',
                price: 490
              }
            },
            {
              type: 'addresses',
              id: 'addr-1',
              attributes: {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Main St',
                city: 'Berlin',
                zipCode: '12345',
                country: 'DE'
              }
            },
            {
              type: 'shipments',
              id: 'ship-1',
              attributes: {
                idShipmentMethod: 1,
                items: ['item-1', 'item-2']
              }
            }
          ]
        }
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await getCheckoutDataTool.handler({
        token: 'test-token-123',
        cartId: 'cart-123'
      });

      expect(mockPost).toHaveBeenCalledWith(
        'checkout-data?include=payment-methods,shipments,shipment-methods,addresses',
        {
          data: {
            type: 'checkout-data',
            attributes: {
              idCart: 'cart-123'
            }
          }
        },
        'test-token-123'
      );

      expect(result.content).toHaveLength(1);
      const response = JSON.parse(result.content[0]!.text);
      
      expect(response.success).toBe(true);
      expect(response.message).toBe('Checkout data retrieved successfully');
      
      // Check checkout data
      expect(response.checkoutData.id).toBe('checkout-123');
      expect(response.checkoutData.idCart).toBe('cart-123');
      expect(response.checkoutData.currencyIsoCode).toBe('EUR');
      
      // Check payment methods
      expect(response.paymentMethods).toHaveLength(2);
      expect(response.paymentMethods[0].id).toBe('1');
      expect(response.paymentMethods[0].name).toBe('Invoice');
      expect(response.paymentMethods[0].provider).toBe('DummyPayment');
      expect(response.paymentMethods[1].id).toBe('2');
      expect(response.paymentMethods[1].name).toBe('Credit Card');
      
      // Check shipment methods
      expect(response.shipmentMethods).toHaveLength(1);
      expect(response.shipmentMethods[0].id).toBe('1');
      expect(response.shipmentMethods[0].name).toBe('Standard Shipping');
      expect(response.shipmentMethods[0].carrier).toBe('DHL');
      expect(response.shipmentMethods[0].price).toBe(490);
      
      // Check customer addresses
      expect(response.customerAddresses).toHaveLength(1);
      expect(response.customerAddresses[0].id).toBe('addr-1');
      expect(response.customerAddresses[0].firstName).toBe('John');
      expect(response.customerAddresses[0].lastName).toBe('Doe');
      expect(response.customerAddresses[0].city).toBe('Berlin');
      
      // Check shipments
      expect(response.shipments).toHaveLength(1);
      expect(response.shipments[0].id).toBe('ship-1');
      expect(response.shipments[0].idShipmentMethod).toBe(1);
      
      // Check availability summary
      expect(response.availableData.hasCheckoutData).toBe(true);
      expect(response.availableData.paymentMethodsCount).toBe(2);
      expect(response.availableData.shipmentMethodsCount).toBe(1);
      expect(response.availableData.customerAddressesCount).toBe(1);
      expect(response.availableData.shipmentsCount).toBe(1);
    });

    it('should handle response with minimal included data', async () => {
      const mockResponse = {
        data: {
          data: {
            type: 'checkout-data',
            id: 'checkout-456',
            attributes: {
              idCart: 'cart-456',
              currencyIsoCode: 'USD'
            }
          },
          included: [
            {
              type: 'payment-methods',
              id: '1',
              attributes: {
                name: 'PayPal',
                provider: 'PayPal'
              }
            }
          ]
        }
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await getCheckoutDataTool.handler({
        token: 'test-token-456',
        cartId: 'cart-456'
      });

      expect(result.content).toHaveLength(1);
      const response = JSON.parse(result.content[0]!.text);
      
      expect(response.success).toBe(true);
      expect(response.checkoutData.id).toBe('checkout-456');
      expect(response.paymentMethods).toHaveLength(1);
      expect(response.shipmentMethods).toHaveLength(0);
      expect(response.customerAddresses).toHaveLength(0);
      expect(response.shipments).toHaveLength(0);
      
      expect(response.availableData.paymentMethodsCount).toBe(1);
      expect(response.availableData.shipmentMethodsCount).toBe(0);
      expect(response.availableData.customerAddressesCount).toBe(0);
      expect(response.availableData.shipmentsCount).toBe(0);
    });

    it('should handle response with no included data', async () => {
      const mockResponse = {
        data: {
          data: {
            type: 'checkout-data',
            id: 'checkout-789',
            attributes: {
              idCart: 'cart-789',
              currencyIsoCode: 'GBP'
            }
          }
          // No included array
        }
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await getCheckoutDataTool.handler({
        token: 'test-token-789',
        cartId: 'cart-789'
      });

      expect(result.content).toHaveLength(1);
      const response = JSON.parse(result.content[0]!.text);
      
      expect(response.success).toBe(true);
      expect(response.checkoutData.id).toBe('checkout-789');
      expect(response.paymentMethods).toHaveLength(0);
      expect(response.shipmentMethods).toHaveLength(0);
      expect(response.customerAddresses).toHaveLength(0);
      expect(response.shipments).toHaveLength(0);
      
      expect(response.availableData.hasCheckoutData).toBe(true);
      expect(response.availableData.paymentMethodsCount).toBe(0);
    });

    it('should handle guest customer token', async () => {
      const mockResponse = {
        data: {
          data: {
            type: 'checkout-data',
            id: 'checkout-guest',
            attributes: {
              idCart: 'guest-cart-123',
              isGuest: true
            }
          },
          included: [
            {
              type: 'payment-methods',
              id: '1',
              attributes: {
                name: 'Cash on Delivery',
                provider: 'COD'
              }
            }
          ]
        }
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await getCheckoutDataTool.handler({
        token: 'guest-token-abc123',
        cartId: 'guest-cart-123'
      });

      expect(mockPost).toHaveBeenCalledWith(
        'checkout-data?include=payment-methods,shipments,shipment-methods,addresses',
        {
          data: {
            type: 'checkout-data',
            attributes: {
              idCart: 'guest-cart-123'
            }
          }
        },
        'guest-token-abc123'
      );

      expect(result.content).toHaveLength(1);
      const response = JSON.parse(result.content[0]!.text);
      expect(response.success).toBe(true);
      expect(response.checkoutData.isGuest).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      const apiError = new ApiError('Cart not found', 404, 'Not Found', { 
        errors: [{ detail: 'Cart with ID cart-999 not found' }]
      });
      mockPost.mockRejectedValueOnce(apiError);

      const result = await getCheckoutDataTool.handler({
        token: 'test-token',
        cartId: 'cart-999'
      });

      expect(result.content).toHaveLength(1);
      const response = JSON.parse(result.content[0]!.text);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Failed to retrieve checkout data');
      expect(response.message).toBe('Cart not found');
      expect(response.responseData).toEqual({ 
        errors: [{ detail: 'Cart with ID cart-999 not found' }]
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      mockPost.mockRejectedValueOnce(networkError);

      const result = await getCheckoutDataTool.handler({
        token: 'test-token',
        cartId: 'cart-123'
      });

      expect(result.content).toHaveLength(1);
      const response = JSON.parse(result.content[0]!.text);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Failed to retrieve checkout data');
      expect(response.message).toBe('Network connection failed');
      expect(response.responseData).toEqual([]);
    });

    it('should handle unauthorized access', async () => {
      const authError = new ApiError('Unauthorized', 401, 'Unauthorized');
      mockPost.mockRejectedValueOnce(authError);

      const result = await getCheckoutDataTool.handler({
        token: 'invalid-token',
        cartId: 'cart-123'
      });

      expect(result.content).toHaveLength(1);
      const response = JSON.parse(result.content[0]!.text);
      expect(response.success).toBe(false);
      expect(response.message).toBe('Unauthorized');
    });

    it('should handle validation errors for missing fields', async () => {
      await expect(getCheckoutDataTool.handler({
        token: 'test-token'
        // Missing cartId
      })).rejects.toThrow();

      await expect(getCheckoutDataTool.handler({
        cartId: 'cart-123'
        // Missing token
      })).rejects.toThrow();
    });

    it('should handle validation errors for invalid field types', async () => {
      await expect(getCheckoutDataTool.handler({
        token: 123, // Should be string
        cartId: 'cart-123'
      })).rejects.toThrow();

      await expect(getCheckoutDataTool.handler({
        token: 'test-token',
        cartId: null // Should be string
      })).rejects.toThrow();
    });
  });

  describe('data filtering and parsing', () => {
    it('should correctly filter different types from included data', async () => {
      const mockResponse = {
        data: {
          data: {
            type: 'checkout-data',
            id: 'checkout-test',
            attributes: { idCart: 'cart-test' }
          },
          included: [
            { type: 'payment-methods', id: '1', attributes: { name: 'Method1' } },
            { type: 'unknown-type', id: '2', attributes: { name: 'Unknown' } },
            { type: 'shipment-methods', id: '3', attributes: { name: 'Shipping1' } },
            { type: 'payment-methods', id: '4', attributes: { name: 'Method2' } },
            { type: 'addresses', id: '5', attributes: { name: 'Address1' } },
            { type: 'shipments', id: '6', attributes: { name: 'Shipment1' } }
          ]
        }
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await getCheckoutDataTool.handler({
        token: 'test-token',
        cartId: 'cart-test'
      });

      const response = JSON.parse(result.content[0]!.text);
      
      expect(response.paymentMethods).toHaveLength(2);
      expect(response.paymentMethods[0].id).toBe('1');
      expect(response.paymentMethods[1].id).toBe('4');
      
      expect(response.shipmentMethods).toHaveLength(1);
      expect(response.shipmentMethods[0].id).toBe('3');
      
      expect(response.customerAddresses).toHaveLength(1);
      expect(response.customerAddresses[0].id).toBe('5');
      
      expect(response.shipments).toHaveLength(1);
      expect(response.shipments[0].id).toBe('6');
    });

    it('should preserve all attributes from included items', async () => {
      const mockResponse = {
        data: {
          data: {
            type: 'checkout-data',
            id: 'checkout-test',
            attributes: { idCart: 'cart-test' }
          },
          included: [
            {
              type: 'payment-methods',
              id: '1',
              attributes: {
                name: 'Credit Card',
                provider: 'Stripe',
                isSelected: true,
                minimumAmount: 100,
                maximumAmount: 10000,
                description: 'Pay with credit card'
              }
            }
          ]
        }
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await getCheckoutDataTool.handler({
        token: 'test-token',
        cartId: 'cart-test'
      });

      const response = JSON.parse(result.content[0]!.text);
      const paymentMethod = response.paymentMethods[0];
      
      expect(paymentMethod.id).toBe('1');
      expect(paymentMethod.name).toBe('Credit Card');
      expect(paymentMethod.provider).toBe('Stripe');
      expect(paymentMethod.isSelected).toBe(true);
      expect(paymentMethod.minimumAmount).toBe(100);
      expect(paymentMethod.maximumAmount).toBe(10000);
      expect(paymentMethod.description).toBe('Pay with credit card');
    });
  });

  describe('tool configuration', () => {
    it('should have proper tool definition', () => {
      expect(getCheckoutDataTool.name).toBe('get-checkout-data');
      expect(getCheckoutDataTool.description).toContain('Get checkout data');
      expect(getCheckoutDataTool.description).toContain('payment methods');
      expect(getCheckoutDataTool.description).toContain('shipment methods');
      expect(typeof getCheckoutDataTool.handler).toBe('function');
      expect(getCheckoutDataTool.inputSchema).toBeDefined();
      expect(getCheckoutDataTool.inputSchema.type).toBe('object');
    });
  });
});
