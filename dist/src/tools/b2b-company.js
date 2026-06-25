/**
 * B2B Company Tools
 *
 * Read access to the company structure for B2B customers: company users,
 * business units, roles, and company details. All require an authenticated
 * B2B company-user token and are only exposed in the B2B business model.
 */
import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
const B2B_AVAILABILITY = { models: ['b2b'] };
function errorResponse(action, error, extra = {}) {
    return {
        content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    error: `Failed to ${action}`,
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                    responseData: error instanceof ApiError ? error.responseData : [],
                    ...extra,
                }, null, 2),
            }],
        isError: true,
    };
}
function listResponse(message, status, key, data) {
    const items = Array.isArray(data) ? data : data ? [data] : [];
    return {
        content: [{
                type: 'text',
                text: JSON.stringify({
                    success: status === 200,
                    message,
                    [key]: items.map(item => ({
                        id: item.id,
                        attributes: item.attributes,
                    })),
                }, null, 2),
            }],
    };
}
// --- Company users ---
const GetCompanyUsersSchema = z.object({
    token: z.string().describe('B2B customer access token'),
});
async function getCompanyUsers(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Retrieving company users');
        const response = await apiService.get('company-users', args.token);
        return listResponse('Company users retrieved successfully', response.status, 'companyUsers', response.data.data);
    }
    catch (error) {
        logger.error('Get company users failed', error);
        return errorResponse('retrieve company users', error);
    }
}
export const getCompanyUsersTool = {
    name: 'get-company-users',
    description: 'List the company users associated with the authenticated B2B customer.',
    availability: B2B_AVAILABILITY,
    inputSchema: z.toJSONSchema(GetCompanyUsersSchema),
    handler: async (args) => getCompanyUsers(GetCompanyUsersSchema.parse(args)),
};
// --- Business units ---
const GetBusinessUnitsSchema = z.object({
    token: z.string().describe('B2B customer access token'),
});
async function getBusinessUnits(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Retrieving business units');
        const response = await apiService.get('company-business-units', args.token);
        return listResponse('Business units retrieved successfully', response.status, 'businessUnits', response.data.data);
    }
    catch (error) {
        logger.error('Get business units failed', error);
        return errorResponse('retrieve business units', error);
    }
}
export const getBusinessUnitsTool = {
    name: 'get-business-units',
    description: 'List the company business units available to the authenticated B2B customer.',
    availability: B2B_AVAILABILITY,
    inputSchema: z.toJSONSchema(GetBusinessUnitsSchema),
    handler: async (args) => getBusinessUnits(GetBusinessUnitsSchema.parse(args)),
};
// --- Company roles ---
const GetCompanyRolesSchema = z.object({
    token: z.string().describe('B2B customer access token'),
});
async function getCompanyRoles(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Retrieving company roles');
        const response = await apiService.get('company-roles', args.token);
        return listResponse('Company roles retrieved successfully', response.status, 'companyRoles', response.data.data);
    }
    catch (error) {
        logger.error('Get company roles failed', error);
        return errorResponse('retrieve company roles', error);
    }
}
export const getCompanyRolesTool = {
    name: 'get-company-roles',
    description: 'List the company roles available to the authenticated B2B customer.',
    availability: B2B_AVAILABILITY,
    inputSchema: z.toJSONSchema(GetCompanyRolesSchema),
    handler: async (args) => getCompanyRoles(GetCompanyRolesSchema.parse(args)),
};
// --- Company details ---
const GetCompanySchema = z.object({
    token: z.string().describe('B2B customer access token'),
    companyId: z.string().describe('Company ID (UUID) to retrieve'),
});
async function getCompany(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Retrieving company', { companyId: args.companyId });
        const response = await apiService.get(`companies/${args.companyId}`, args.token);
        const company = response.data.data;
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: response.status === 200,
                        message: 'Company retrieved successfully',
                        company: { id: company.id, attributes: company.attributes },
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Get company failed', error);
        return errorResponse('retrieve company', error, { companyId: args.companyId });
    }
}
export const getCompanyTool = {
    name: 'get-company',
    description: 'Get details of a B2B company by its ID.',
    availability: B2B_AVAILABILITY,
    inputSchema: z.toJSONSchema(GetCompanySchema),
    handler: async (args) => getCompany(GetCompanySchema.parse(args)),
};
//# sourceMappingURL=b2b-company.js.map