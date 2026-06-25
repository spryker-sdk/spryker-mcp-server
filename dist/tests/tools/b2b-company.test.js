/**
 * Tests for B2B company tools
 */
import { getCompanyUsersTool, getBusinessUnitsTool, getCompanyRolesTool, getCompanyTool, } from '../../src/tools/b2b-company';
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
describe('B2B company tools availability', () => {
    it('are all tagged for the b2b model only', () => {
        for (const tool of [getCompanyUsersTool, getBusinessUnitsTool, getCompanyRolesTool, getCompanyTool]) {
            expect(tool.availability).toEqual({ models: ['b2b'] });
        }
    });
});
describe('getCompanyUsersTool', () => {
    it('lists company users', async () => {
        mockApiService.get.mockResolvedValue({ status: 200, data: { data: [{ type: 'company-users', id: 'cu-1', attributes: {} }] } });
        const result = await getCompanyUsersTool.handler({ token: 'auth' });
        expect(mockApiService.get).toHaveBeenCalledWith('company-users', 'auth');
        const r = JSON.parse(result.content[0].text);
        expect(r.success).toBe(true);
        expect(r.companyUsers).toHaveLength(1);
    });
    it('handles null data', async () => {
        mockApiService.get.mockResolvedValue({ status: 200, data: { data: null } });
        const result = await getCompanyUsersTool.handler({ token: 'auth' });
        expect(JSON.parse(result.content[0].text).companyUsers).toHaveLength(0);
    });
    it('handles ApiError', async () => {
        mockApiService.get.mockRejectedValue(new ApiError('x', 401, 'Unauthorized', ['no']));
        const result = await getCompanyUsersTool.handler({ token: 'auth' });
        expect('isError' in result && result.isError).toBe(true);
        expect(JSON.parse(result.content[0].text).responseData).toEqual(['no']);
    });
    it('validates input', async () => {
        await expect(getCompanyUsersTool.handler({})).rejects.toThrow();
    });
});
describe('getBusinessUnitsTool', () => {
    it('lists business units', async () => {
        mockApiService.get.mockResolvedValue({ status: 200, data: { data: [{ type: 'company-business-units', id: 'bu-1', attributes: {} }] } });
        const result = await getBusinessUnitsTool.handler({ token: 'auth' });
        expect(mockApiService.get).toHaveBeenCalledWith('company-business-units', 'auth');
        expect(JSON.parse(result.content[0].text).businessUnits).toHaveLength(1);
    });
    it('handles non-Error rejection', async () => {
        mockApiService.get.mockRejectedValue('boom');
        const result = await getBusinessUnitsTool.handler({ token: 'auth' });
        expect(JSON.parse(result.content[0].text).message).toBe('Unknown error occurred');
    });
});
describe('getCompanyRolesTool', () => {
    it('lists company roles (single object wrapped)', async () => {
        mockApiService.get.mockResolvedValue({ status: 200, data: { data: { type: 'company-roles', id: 'r-1', attributes: {} } } });
        const result = await getCompanyRolesTool.handler({ token: 'auth' });
        expect(mockApiService.get).toHaveBeenCalledWith('company-roles', 'auth');
        expect(JSON.parse(result.content[0].text).companyRoles).toHaveLength(1);
    });
    it('handles ApiError', async () => {
        mockApiService.get.mockRejectedValue(new ApiError('x', 500, 'Server Error'));
        const result = await getCompanyRolesTool.handler({ token: 'auth' });
        expect('isError' in result && result.isError).toBe(true);
    });
});
describe('getCompanyTool', () => {
    it('gets a company by id', async () => {
        mockApiService.get.mockResolvedValue({ status: 200, data: { data: { type: 'companies', id: 'co-1', attributes: { name: 'Acme' } } } });
        const result = await getCompanyTool.handler({ token: 'auth', companyId: 'co-1' });
        expect(mockApiService.get).toHaveBeenCalledWith('companies/co-1', 'auth');
        const r = JSON.parse(result.content[0].text);
        expect(r.success).toBe(true);
        expect(r.company.id).toBe('co-1');
    });
    it('handles ApiError with response data', async () => {
        mockApiService.get.mockRejectedValue(new ApiError('x', 404, 'Not Found', ['missing']));
        const result = await getCompanyTool.handler({ token: 'auth', companyId: 'co-1' });
        expect(JSON.parse(result.content[0].text).responseData).toEqual(['missing']);
    });
    it('validates input', async () => {
        await expect(getCompanyTool.handler({ token: 'auth' })).rejects.toThrow();
    });
});
//# sourceMappingURL=b2b-company.test.js.map