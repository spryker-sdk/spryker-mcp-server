/**
 * Tests for customer account tools: register-customer, refresh-token
 */

import { registerCustomerTool } from '../../src/tools/register-customer';
import { refreshTokenTool } from '../../src/tools/refresh-token';
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

const mockApiService = { post: jest.fn() };
const mockLogger = logger as any;

beforeEach(() => {
  jest.clearAllMocks();
  (SprykerApiService.getInstance as jest.Mock).mockReturnValue(mockApiService);
  mockLogger.info = jest.fn();
  mockLogger.error = jest.fn();
});

describe('registerCustomerTool', () => {
  const validArgs = {
    email: 'jane@example.com',
    password: 'secret123',
    confirmPassword: 'secret123',
    firstName: 'Jane',
    lastName: 'Doe',
    salutation: 'Ms',
  };

  it('should have correct name and schema', () => {
    expect(registerCustomerTool.name).toBe('register-customer');
    expect(registerCustomerTool.inputSchema.properties.email).toBeDefined();
  });

  it('should register a customer', async () => {
    mockApiService.post.mockResolvedValue({ status: 201, data: { data: { id: 'ref-1' } } });

    const result = await registerCustomerTool.handler(validArgs);

    expect(mockApiService.post).toHaveBeenCalledWith('customers', {
      data: {
        type: 'customers',
        attributes: {
          salutation: 'Ms',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'secret123',
          confirmPassword: 'secret123',
          acceptedTerms: true,
        },
      },
    });
    expect(JSON.parse(result.content[0]!.text).success).toBe(true);
  });

  it('should omit salutation when not provided', async () => {
    mockApiService.post.mockResolvedValue({ status: 201, data: { data: {} } });
    const { salutation: _omit, ...noSalutation } = validArgs;
    await registerCustomerTool.handler(noSalutation);
    const body = mockApiService.post.mock.calls[0][1];
    expect(body.data.attributes.salutation).toBeUndefined();
  });

  it('should handle ApiError with response data', async () => {
    mockApiService.post.mockRejectedValue(new ApiError('exists', 422, 'Unprocessable', ['email taken']));
    const result = await registerCustomerTool.handler(validArgs);
    expect('isError' in result && result.isError).toBe(true);
    expect(JSON.parse(result.content[0]!.text).responseData).toEqual(['email taken']);
  });

  it('should validate input (invalid email)', async () => {
    await expect(registerCustomerTool.handler({ ...validArgs, email: 'not-an-email' })).rejects.toThrow();
  });
});

describe('refreshTokenTool', () => {
  it('should have correct name and schema', () => {
    expect(refreshTokenTool.name).toBe('refresh-token');
    expect(refreshTokenTool.inputSchema.properties.refreshToken).toBeDefined();
  });

  it('should refresh an access token', async () => {
    mockApiService.post.mockResolvedValue({
      status: 201,
      data: {
        data: {
          attributes: {
            tokenType: 'Bearer',
            expiresIn: 3600,
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
          },
        },
      },
    });

    const result = await refreshTokenTool.handler({ refreshToken: 'old-refresh' });

    expect(mockApiService.post).toHaveBeenCalledWith('refresh-tokens', {
      data: { type: 'refresh-tokens', attributes: { refreshToken: 'old-refresh' } },
    });
    const response = JSON.parse(result.content[0]!.text);
    expect(response.success).toBe(true);
    expect(response.accessToken).toBe('new-access');
  });

  it('should handle non-Error rejection', async () => {
    mockApiService.post.mockRejectedValue('boom');
    const result = await refreshTokenTool.handler({ refreshToken: 'x' });
    expect('isError' in result && result.isError).toBe(true);
    expect(JSON.parse(result.content[0]!.text).message).toBe('Unknown error occurred');
  });

  it('should validate input', async () => {
    await expect(refreshTokenTool.handler({})).rejects.toThrow();
  });
});
