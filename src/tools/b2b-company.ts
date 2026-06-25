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
import type { SprykerTool, ToolAvailability } from './types.js';

const B2B_AVAILABILITY: ToolAvailability = { models: ['b2b'] };

function errorResponse(action: string, error: unknown, extra: Record<string, unknown> = {}) {
  return {
    content: [{
      type: 'text' as const,
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

function listResponse(message: string, status: number, key: string, data: unknown) {
  const items = Array.isArray(data) ? data : data ? [data] : [];
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: status === 200,
        message,
        [key]: (items as Array<{ id: string; attributes: unknown }>).map(item => ({
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

async function getCompanyUsers(args: z.infer<typeof GetCompanyUsersSchema>) {
  const apiService = SprykerApiService.getInstance();
  try {
    logger.info('Retrieving company users');
    const response = await apiService.get<{ data: unknown }>('company-users', args.token);
    return listResponse('Company users retrieved successfully', response.status, 'companyUsers', response.data.data);
  } catch (error) {
    logger.error('Get company users failed', error as Error);
    return errorResponse('retrieve company users', error);
  }
}

export const getCompanyUsersTool: SprykerTool = {
  name: 'get-company-users',
  description: 'List the company users associated with the authenticated B2B customer.',
  availability: B2B_AVAILABILITY,
  inputSchema: z.toJSONSchema(GetCompanyUsersSchema) as any,
  handler: async (args: Record<string, unknown>) => getCompanyUsers(GetCompanyUsersSchema.parse(args)),
};

// --- Business units ---

const GetBusinessUnitsSchema = z.object({
  token: z.string().describe('B2B customer access token'),
});

async function getBusinessUnits(args: z.infer<typeof GetBusinessUnitsSchema>) {
  const apiService = SprykerApiService.getInstance();
  try {
    logger.info('Retrieving business units');
    const response = await apiService.get<{ data: unknown }>('company-business-units', args.token);
    return listResponse('Business units retrieved successfully', response.status, 'businessUnits', response.data.data);
  } catch (error) {
    logger.error('Get business units failed', error as Error);
    return errorResponse('retrieve business units', error);
  }
}

export const getBusinessUnitsTool: SprykerTool = {
  name: 'get-business-units',
  description: 'List the company business units available to the authenticated B2B customer.',
  availability: B2B_AVAILABILITY,
  inputSchema: z.toJSONSchema(GetBusinessUnitsSchema) as any,
  handler: async (args: Record<string, unknown>) => getBusinessUnits(GetBusinessUnitsSchema.parse(args)),
};

// --- Company roles ---

const GetCompanyRolesSchema = z.object({
  token: z.string().describe('B2B customer access token'),
});

async function getCompanyRoles(args: z.infer<typeof GetCompanyRolesSchema>) {
  const apiService = SprykerApiService.getInstance();
  try {
    logger.info('Retrieving company roles');
    const response = await apiService.get<{ data: unknown }>('company-roles', args.token);
    return listResponse('Company roles retrieved successfully', response.status, 'companyRoles', response.data.data);
  } catch (error) {
    logger.error('Get company roles failed', error as Error);
    return errorResponse('retrieve company roles', error);
  }
}

export const getCompanyRolesTool: SprykerTool = {
  name: 'get-company-roles',
  description: 'List the company roles available to the authenticated B2B customer.',
  availability: B2B_AVAILABILITY,
  inputSchema: z.toJSONSchema(GetCompanyRolesSchema) as any,
  handler: async (args: Record<string, unknown>) => getCompanyRoles(GetCompanyRolesSchema.parse(args)),
};

// --- Company details ---

const GetCompanySchema = z.object({
  token: z.string().describe('B2B customer access token'),
  companyId: z.string().describe('Company ID (UUID) to retrieve'),
});

async function getCompany(args: z.infer<typeof GetCompanySchema>) {
  const apiService = SprykerApiService.getInstance();
  try {
    logger.info('Retrieving company', { companyId: args.companyId });
    const response = await apiService.get<{
      data: { type: string; id: string; attributes: Record<string, unknown> };
    }>(`companies/${args.companyId}`, args.token);
    const company = response.data.data;
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: response.status === 200,
          message: 'Company retrieved successfully',
          company: { id: company.id, attributes: company.attributes },
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Get company failed', error as Error);
    return errorResponse('retrieve company', error, { companyId: args.companyId });
  }
}

export const getCompanyTool: SprykerTool = {
  name: 'get-company',
  description: 'Get details of a B2B company by its ID.',
  availability: B2B_AVAILABILITY,
  inputSchema: z.toJSONSchema(GetCompanySchema) as any,
  handler: async (args: Record<string, unknown>) => getCompany(GetCompanySchema.parse(args)),
};
