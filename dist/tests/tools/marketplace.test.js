/**
 * Tests for marketplace tools
 */
import { getMerchantsTool, getMerchantTool, getProductOffersTool } from '../../src/tools/marketplace';
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
const mockLogger = logger;
beforeEach(() => {
    jest.clearAllMocks();
    SprykerApiService.getInstance.mockReturnValue(mockApiService);
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();
});
describe('marketplace tools availability', () => {
    it('require the marketplace capability', () => {
        for (const tool of [getMerchantsTool, getMerchantTool, getProductOffersTool]) {
            expect(tool.availability).toEqual({ marketplace: true });
        }
    });
});
describe('getMerchantsTool', () => {
    it('lists merchants', async () => {
        mockApiService.get.mockResolvedValue({ status: 200, data: { data: [{ type: 'merchants', id: 'm-1', attributes: { name: 'Seller A' } }] } });
        const result = await getMerchantsTool.handler({});
        expect(mockApiService.get).toHaveBeenCalledWith('merchants');
        expect(JSON.parse(result.content[0].text).merchants).toHaveLength(1);
    });
    it('handles null data', async () => {
        mockApiService.get.mockResolvedValue({ status: 200, data: { data: null } });
        const result = await getMerchantsTool.handler({});
        expect(JSON.parse(result.content[0].text).merchants).toHaveLength(0);
    });
    it('handles ApiError', async () => {
        mockApiService.get.mockRejectedValue(new ApiError('x', 500, 'Server Error', ['err']));
        const result = await getMerchantsTool.handler({});
        expect('isError' in result && result.isError).toBe(true);
        expect(JSON.parse(result.content[0].text).responseData).toEqual(['err']);
    });
});
describe('getMerchantTool', () => {
    it('gets a merchant with included profile', async () => {
        mockApiService.get.mockResolvedValue({
            status: 200,
            data: {
                data: { type: 'merchants', id: 'MER-1', attributes: { name: 'Seller A' } },
                included: [{ type: 'merchant-addresses', id: 'a-1', attributes: {} }],
            },
        });
        const result = await getMerchantTool.handler({ merchantReference: 'MER-1' });
        expect(mockApiService.get).toHaveBeenCalledWith('merchants/MER-1?include=merchant-addresses,merchant-opening-hours');
        const r = JSON.parse(result.content[0].text);
        expect(r.merchant.id).toBe('MER-1');
        expect(r.included).toHaveLength(1);
    });
    it('handles response without included', async () => {
        mockApiService.get.mockResolvedValue({ status: 200, data: { data: { type: 'merchants', id: 'MER-1', attributes: {} } } });
        const result = await getMerchantTool.handler({ merchantReference: 'MER-1' });
        expect(JSON.parse(result.content[0].text).included).toHaveLength(0);
    });
    it('handles non-Error rejection', async () => {
        mockApiService.get.mockRejectedValue('boom');
        const result = await getMerchantTool.handler({ merchantReference: 'MER-1' });
        expect(JSON.parse(result.content[0].text).message).toBe('Unknown error occurred');
    });
    it('validates input', async () => {
        await expect(getMerchantTool.handler({})).rejects.toThrow();
    });
});
describe('getProductOffersTool', () => {
    it('lists offers for a concrete SKU', async () => {
        mockApiService.get.mockResolvedValue({ status: 200, data: { data: [{ type: 'product-offers', id: 'o-1', attributes: { merchantReference: 'MER-1' } }] } });
        const result = await getProductOffersTool.handler({ sku: 'CONC-1' });
        expect(mockApiService.get).toHaveBeenCalledWith('concrete-products/CONC-1/product-offers');
        const r = JSON.parse(result.content[0].text);
        expect(r.offers).toHaveLength(1);
        expect(r.sku).toBe('CONC-1');
    });
    it('handles ApiError', async () => {
        mockApiService.get.mockRejectedValue(new ApiError('x', 404, 'Not Found', ['missing']));
        const result = await getProductOffersTool.handler({ sku: 'CONC-1' });
        expect('isError' in result && result.isError).toBe(true);
    });
    it('validates input', async () => {
        await expect(getProductOffersTool.handler({})).rejects.toThrow();
    });
});
//# sourceMappingURL=marketplace.test.js.map