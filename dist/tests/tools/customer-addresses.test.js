/**
 * Tests for customer address book tools
 */
import { getAddressesTool, addAddressTool, updateAddressTool, deleteAddressTool, } from '../../src/tools/customer-addresses';
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
const mockApiService = { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() };
const mockLogger = logger;
const address = {
    firstName: 'Jane',
    lastName: 'Doe',
    address1: 'Main Street',
    zipCode: '10115',
    city: 'Berlin',
    iso2Code: 'DE',
};
beforeEach(() => {
    jest.clearAllMocks();
    SprykerApiService.getInstance.mockReturnValue(mockApiService);
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();
});
describe('getAddressesTool', () => {
    it('should list addresses', async () => {
        mockApiService.get.mockResolvedValue({
            status: 200,
            data: { data: [{ type: 'addresses', id: 'a1', attributes: address }] },
        });
        const result = await getAddressesTool.handler({ token: 'auth', customerReference: 'ref-1' });
        expect(mockApiService.get).toHaveBeenCalledWith('customers/ref-1/addresses', 'auth');
        expect(JSON.parse(result.content[0].text).addresses).toHaveLength(1);
    });
    it('should handle null data', async () => {
        mockApiService.get.mockResolvedValue({ status: 200, data: { data: null } });
        const result = await getAddressesTool.handler({ token: 'auth', customerReference: 'ref-1' });
        expect(JSON.parse(result.content[0].text).addresses).toHaveLength(0);
    });
    it('should handle ApiError', async () => {
        mockApiService.get.mockRejectedValue(new ApiError('x', 403, 'Forbidden', ['no']));
        const result = await getAddressesTool.handler({ token: 'auth', customerReference: 'ref-1' });
        expect('isError' in result && result.isError).toBe(true);
        expect(JSON.parse(result.content[0].text).responseData).toEqual(['no']);
    });
    it('should validate input', async () => {
        await expect(getAddressesTool.handler({ token: 'auth' })).rejects.toThrow();
    });
});
describe('addAddressTool', () => {
    it('should add an address', async () => {
        mockApiService.post.mockResolvedValue({ status: 201, data: { data: { id: 'a1' } } });
        const result = await addAddressTool.handler({ token: 'auth', customerReference: 'ref-1', address });
        expect(mockApiService.post).toHaveBeenCalledWith('customers/ref-1/addresses', { data: { type: 'addresses', attributes: address } }, 'auth');
        expect(JSON.parse(result.content[0].text).success).toBe(true);
    });
    it('should handle non-Error rejection', async () => {
        mockApiService.post.mockRejectedValue('boom');
        const result = await addAddressTool.handler({ token: 'auth', customerReference: 'ref-1', address });
        expect('isError' in result && result.isError).toBe(true);
        expect(JSON.parse(result.content[0].text).message).toBe('Unknown error occurred');
    });
    it('should validate input (missing required address field)', async () => {
        await expect(addAddressTool.handler({ token: 'auth', customerReference: 'ref-1', address: { firstName: 'Jane' } })).rejects.toThrow();
    });
});
describe('updateAddressTool', () => {
    it('should update an address', async () => {
        mockApiService.patch.mockResolvedValue({ status: 200, data: { data: { id: 'a1' } } });
        const result = await updateAddressTool.handler({
            token: 'auth',
            customerReference: 'ref-1',
            addressId: 'a1',
            address: { city: 'Hamburg' },
        });
        expect(mockApiService.patch).toHaveBeenCalledWith('customers/ref-1/addresses/a1', { data: { type: 'addresses', attributes: { city: 'Hamburg' } } }, 'auth');
        expect(JSON.parse(result.content[0].text).success).toBe(true);
    });
    it('should handle ApiError', async () => {
        mockApiService.patch.mockRejectedValue(new ApiError('x', 404, 'Not Found', ['missing']));
        const result = await updateAddressTool.handler({
            token: 'auth',
            customerReference: 'ref-1',
            addressId: 'a1',
            address: { city: 'Hamburg' },
        });
        expect(JSON.parse(result.content[0].text).responseData).toEqual(['missing']);
    });
    it('should validate input', async () => {
        await expect(updateAddressTool.handler({ token: 'auth', customerReference: 'ref-1' })).rejects.toThrow();
    });
});
describe('deleteAddressTool', () => {
    it('should delete an address', async () => {
        mockApiService.delete.mockResolvedValue({ status: 204, data: {} });
        const result = await deleteAddressTool.handler({ token: 'auth', customerReference: 'ref-1', addressId: 'a1' });
        expect(mockApiService.delete).toHaveBeenCalledWith('customers/ref-1/addresses/a1', 'auth');
        expect(JSON.parse(result.content[0].text).success).toBe(true);
    });
    it('should handle ApiError', async () => {
        mockApiService.delete.mockRejectedValue(new ApiError('x', 404, 'Not Found', ['missing']));
        const result = await deleteAddressTool.handler({ token: 'auth', customerReference: 'ref-1', addressId: 'a1' });
        expect('isError' in result && result.isError).toBe(true);
        expect(JSON.parse(result.content[0].text).responseData).toEqual(['missing']);
    });
    it('should validate input', async () => {
        await expect(deleteAddressTool.handler({ token: 'auth', customerReference: 'ref-1' })).rejects.toThrow();
    });
});
//# sourceMappingURL=customer-addresses.test.js.map