/**
 * Tests for cart voucher tools: add-cart-voucher, remove-cart-voucher
 */
import { addCartVoucherTool } from '../../src/tools/add-cart-voucher';
import { removeCartVoucherTool } from '../../src/tools/remove-cart-voucher';
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
const mockApiService = { post: jest.fn(), delete: jest.fn() };
const mockLogger = logger;
beforeEach(() => {
    jest.clearAllMocks();
    SprykerApiService.getInstance.mockReturnValue(mockApiService);
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();
});
describe('addCartVoucherTool', () => {
    it('should have correct name and schema', () => {
        expect(addCartVoucherTool.name).toBe('add-cart-voucher');
        expect(addCartVoucherTool.inputSchema.properties.code).toBeDefined();
    });
    it('should apply a voucher to a registered cart', async () => {
        mockApiService.post.mockResolvedValue({ status: 201, data: { data: {} } });
        const result = await addCartVoucherTool.handler({ token: 'auth-token', cartId: 'c1', code: 'SAVE10' });
        expect(mockApiService.post).toHaveBeenCalledWith('carts/c1/vouchers', { data: { type: 'cart-vouchers', attributes: { code: 'SAVE10' } } }, 'auth-token');
        expect(JSON.parse(result.content[0].text).success).toBe(true);
    });
    it('should apply a voucher to a guest cart', async () => {
        mockApiService.post.mockResolvedValue({ status: 201, data: { data: {} } });
        await addCartVoucherTool.handler({ token: 'guest-abc', cartId: 'c1', code: 'SAVE10' });
        expect(mockApiService.post).toHaveBeenCalledWith('guest-carts/c1/vouchers', { data: { type: 'guest-cart-vouchers', attributes: { code: 'SAVE10' } } }, 'guest-abc');
    });
    it('should handle ApiError with response data', async () => {
        mockApiService.post.mockRejectedValue(new ApiError('invalid', 422, 'Unprocessable', ['bad code']));
        const result = await addCartVoucherTool.handler({ token: 'auth', cartId: 'c1', code: 'X' });
        expect('isError' in result && result.isError).toBe(true);
        expect(JSON.parse(result.content[0].text).responseData).toEqual(['bad code']);
    });
    it('should handle non-Error rejection', async () => {
        mockApiService.post.mockRejectedValue('boom');
        const result = await addCartVoucherTool.handler({ token: 'auth', cartId: 'c1', code: 'X' });
        expect(JSON.parse(result.content[0].text).message).toBe('Unknown error occurred');
    });
    it('should validate input', async () => {
        await expect(addCartVoucherTool.handler({ token: 'auth', cartId: 'c1' })).rejects.toThrow();
    });
});
describe('removeCartVoucherTool', () => {
    it('should have correct name', () => {
        expect(removeCartVoucherTool.name).toBe('remove-cart-voucher');
    });
    it('should remove a voucher from a registered cart', async () => {
        mockApiService.delete.mockResolvedValue({ status: 204, data: {} });
        const result = await removeCartVoucherTool.handler({ token: 'auth', cartId: 'c1', code: 'SAVE 10' });
        expect(mockApiService.delete).toHaveBeenCalledWith('carts/c1/vouchers/SAVE%2010', 'auth');
        expect(JSON.parse(result.content[0].text).success).toBe(true);
    });
    it('should remove a voucher from a guest cart', async () => {
        mockApiService.delete.mockResolvedValue({ status: 204, data: {} });
        await removeCartVoucherTool.handler({ token: 'guest-x', cartId: 'c1', code: 'AB' });
        expect(mockApiService.delete).toHaveBeenCalledWith('guest-carts/c1/vouchers/AB', 'guest-x');
    });
    it('should handle ApiError with response data', async () => {
        mockApiService.delete.mockRejectedValue(new ApiError('nope', 404, 'Not Found', ['missing']));
        const result = await removeCartVoucherTool.handler({ token: 'auth', cartId: 'c1', code: 'AB' });
        expect('isError' in result && result.isError).toBe(true);
        expect(JSON.parse(result.content[0].text).responseData).toEqual(['missing']);
    });
    it('should validate input', async () => {
        await expect(removeCartVoucherTool.handler({ token: 'auth', cartId: 'c1' })).rejects.toThrow();
    });
});
//# sourceMappingURL=cart-vouchers.test.js.map