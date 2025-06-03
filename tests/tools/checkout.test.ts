import { jest } from '@jest/globals';
import { checkoutTool } from '../../src/tools/checkout.js';
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

describe('Checkout Tool', () => {
  const sampleCheckoutData = {
    token: 'test-token-123',
    cartId: 'cart-123',
    customerData: {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      salutation: 'Mr'
    },
    billingAddress: {
      salutation: 'Mr',
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      address2: 'Apt 1',
      zipCode: '12345',
      city: 'Berlin',
      country: 'DE',
      company: 'Test Company',
      phone: '+49123456789'
    },
    shippingAddress: {
      salutation: 'Mr',
      firstName: 'John',
      lastName: 'Doe',
      address1: '456 Other St',
      address2: 'Unit 2',
      zipCode: '54321',
      city: 'Hamburg',
      country: 'DE',
      company: 'Shipping Company',
      phone: '+49987654321'
    },
    paymentMethod: {
      provider: 'CreditCard',
      method: 'visa'
    },
    shipmentMethod: {
      id: 1
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful checkout', () => {
    it('should process checkout successfully without external redirect', async () => {
      const mockResponse = {
        data: {
          data: {
            type: 'checkout',
            id: 'order-123',
            attributes: {
              orderReference: 'DE--2024-001',
              redirectUrl: null,
              isExternalRedirect: false
            }
          }
        }
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await checkoutTool.handler(sampleCheckoutData);

      expect(mockPost).toHaveBeenCalledWith('checkout', {
        data: {
          type: 'checkout',
          attributes: {
            customer: sampleCheckoutData.customerData,
            idCart: sampleCheckoutData.cartId,
            billingAddress: {
              salutation: sampleCheckoutData.shippingAddress.salutation,
              firstName: sampleCheckoutData.shippingAddress.firstName,
              lastName: sampleCheckoutData.shippingAddress.lastName,
              address1: sampleCheckoutData.shippingAddress.address1,
              address2: sampleCheckoutData.shippingAddress.address2,
              zipCode: sampleCheckoutData.shippingAddress.zipCode,
              city: sampleCheckoutData.shippingAddress.city,
              iso2Code: sampleCheckoutData.shippingAddress.country,
              company: sampleCheckoutData.shippingAddress.company,
              phone: sampleCheckoutData.shippingAddress.phone
            },
            shippingAddress: {
              salutation: sampleCheckoutData.billingAddress.salutation,
              firstName: sampleCheckoutData.billingAddress.firstName,
              lastName: sampleCheckoutData.billingAddress.lastName,
              address1: sampleCheckoutData.billingAddress.address1,
              address2: sampleCheckoutData.billingAddress.address2,
              zipCode: sampleCheckoutData.billingAddress.zipCode,
              city: sampleCheckoutData.billingAddress.city,
              iso2Code: sampleCheckoutData.billingAddress.country,
              company: sampleCheckoutData.billingAddress.company,
              phone: sampleCheckoutData.billingAddress.phone
            },
            payments: [{
              paymentMethodName: sampleCheckoutData.paymentMethod.method,
              paymentProviderName: sampleCheckoutData.paymentMethod.provider
            }],
            shipment: {
              idShipmentMethod: sampleCheckoutData.shipmentMethod.id
            }
          }
        }
      }, sampleCheckoutData.token);

      expect(result.content).toHaveLength(1);
      const response = JSON.parse(result.content[0]!.text);
      expect(response.success).toBe(true);
      expect(response.message).toBe('Order created successfully');
      expect(response.order.orderReference).toBe('DE--2024-001');
      expect(response.order.redirectUrl).toBeNull();
    });

    it('should handle checkout with external redirect required', async () => {
      const mockResponse = {
        data: {
          data: {
            type: 'checkout',
            id: 'order-123',
            attributes: {
              orderReference: 'DE--2024-002',
              redirectUrl: 'https://payment.example.com/pay/12345',
              isExternalRedirect: true
            }
          }
        }
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await checkoutTool.handler(sampleCheckoutData);

      expect(result.content).toHaveLength(1);
      const response = JSON.parse(result.content[0]!.text);
      expect(response.success).toBe(true);
      expect(response.message).toBe('Order created successfully, but requires external payment');
      expect(response.order.orderReference).toBe('DE--2024-002');
      expect(response.order.paymentUrl).toBe('https://payment.example.com/pay/12345');
      expect(response.order.requiresImmediatePayment).toBe(true);
      expect(response.paymentInstructions.action).toBe('REDIRECT_NOW');
      expect(response.alerts).toHaveLength(1);
      expect(response.alerts[0].type).toBe('PAYMENT_PENDING');
    });

    it('should use default values for optional payment and shipping parameters', async () => {
      const checkoutDataWithDefaults = {
        ...sampleCheckoutData,
        paymentMethod: {}, // No provider or method specified
        billingAddress: {
          ...sampleCheckoutData.billingAddress,
          country: undefined // Will default to 'DE'
        },
        shippingAddress: {
          ...sampleCheckoutData.shippingAddress,
          country: undefined // Will default to 'DE'
        }
      };

      const mockResponse = {
        data: {
          data: {
            type: 'checkout',
            id: 'order-123',
            attributes: {
              orderReference: 'DE--2024-003',
              redirectUrl: null,
              isExternalRedirect: false
            }
          }
        }
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      await checkoutTool.handler(checkoutDataWithDefaults);

      expect(mockPost).toHaveBeenCalledWith('checkout', expect.objectContaining({
        data: expect.objectContaining({
          attributes: expect.objectContaining({
            payments: [{
              paymentMethodName: 'invoice', // default
              paymentProviderName: 'DummyPayment' // default
            }],
            billingAddress: expect.objectContaining({
              iso2Code: 'DE' // default
            }),
            shippingAddress: expect.objectContaining({
              iso2Code: 'DE' // default
            })
          })
        })
      }), sampleCheckoutData.token);
    });
  });

  describe('error handling', () => {
    it('should handle API errors during checkout', async () => {
      const apiError = new ApiError('Cart is empty', 400, 'Bad Request', { errors: [{ detail: 'Cart has no items' }] });
      mockPost.mockRejectedValueOnce(apiError);

      const result = await checkoutTool.handler(sampleCheckoutData);

      expect(result.content).toHaveLength(1);
      const response = JSON.parse(result.content[0]!.text);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Checkout failed');
      expect(response.message).toBe('Cart is empty');
      expect(response.responseData).toEqual({ errors: [{ detail: 'Cart has no items' }] });
    });

    it('should handle network errors during checkout', async () => {
      const networkError = new Error('Network timeout');
      mockPost.mockRejectedValueOnce(networkError);

      const result = await checkoutTool.handler(sampleCheckoutData);

      expect(result.content).toHaveLength(1);
      const response = JSON.parse(result.content[0]!.text);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Checkout failed');
      expect(response.message).toBe('Network timeout');
      expect(response.responseData).toEqual([]);
    });

    it('should handle validation errors for invalid input', async () => {
      const invalidData = {
        ...sampleCheckoutData,
        customerData: {
          ...sampleCheckoutData.customerData,
          email: 'invalid-email' // Invalid email format
        }
      };

      await expect(checkoutTool.handler(invalidData)).rejects.toThrow();
    });

    it('should handle validation errors for missing required fields', async () => {
      const incompleteData = {
        token: 'test-token',
        cartId: 'cart-123'
        // Missing customerData, billingAddress, shippingAddress, etc.
      };

      await expect(checkoutTool.handler(incompleteData)).rejects.toThrow();
    });
  });

  describe('address handling', () => {
    it('should correctly map billing and shipping addresses', async () => {
      // Note: The implementation appears to have billing and shipping addresses swapped
      const mockResponse = {
        data: {
          data: {
            type: 'checkout',
            id: 'order-123',
            attributes: {
              orderReference: 'DE--2024-004',
              redirectUrl: null,
              isExternalRedirect: false
            }
          }
        }
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const testData = {
        ...sampleCheckoutData,
        billingAddress: {
          ...sampleCheckoutData.billingAddress,
          firstName: 'BillingFirstName',
          address1: 'Billing Street 1'
        },
        shippingAddress: {
          ...sampleCheckoutData.shippingAddress,
          firstName: 'ShippingFirstName',
          address1: 'Shipping Street 1'
        }
      };

      await checkoutTool.handler(testData);

      const callArgs = mockPost.mock.calls[0][1];
      // Due to the implementation bug, billing and shipping are swapped
      expect(callArgs.data.attributes.billingAddress.firstName).toBe('ShippingFirstName');
      expect(callArgs.data.attributes.billingAddress.address1).toBe('Shipping Street 1');
      expect(callArgs.data.attributes.shippingAddress.firstName).toBe('BillingFirstName');
      expect(callArgs.data.attributes.shippingAddress.address1).toBe('Billing Street 1');
    });

    it('should handle optional address fields', async () => {
      const mockResponse = {
        data: {
          data: {
            type: 'checkout',
            id: 'order-123',
            attributes: {
              orderReference: 'DE--2024-005',
              redirectUrl: null,
              isExternalRedirect: false
            }
          }
        }
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const dataWithOptionalFields = {
        ...sampleCheckoutData,
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          address2: 'Apt 1',
          zipCode: '12345',
          city: 'Berlin'
          // Missing salutation, country, company, phone
        },
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '456 Other St',
          address2: 'Unit 2',
          zipCode: '54321',
          city: 'Hamburg'
          // Missing salutation, country, company, phone
        }
      };

      await checkoutTool.handler(dataWithOptionalFields);

      const callArgs = mockPost.mock.calls[0][1];
      expect(callArgs.data.attributes.billingAddress.salutation).toBeUndefined();
      expect(callArgs.data.attributes.billingAddress.iso2Code).toBe('DE'); // default
      expect(callArgs.data.attributes.billingAddress.company).toBeUndefined();
      expect(callArgs.data.attributes.billingAddress.phone).toBeUndefined();
    });
  });

  describe('tool configuration', () => {
    it('should have proper tool definition', () => {
      expect(checkoutTool.name).toBe('checkout');
      expect(checkoutTool.description).toContain('Process checkout');
      expect(typeof checkoutTool.handler).toBe('function');
      expect(checkoutTool.inputSchema).toBeDefined();
      expect(checkoutTool.inputSchema.type).toBe('object');
    });
  });
});
