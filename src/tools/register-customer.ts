/**
 * Register Customer Tool
 *
 * Creates a new customer account.
 */

import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

const RegisterCustomerSchema = z.object({
  email: z.email().describe('Customer email address'),
  password: z.string().describe('Account password'),
  confirmPassword: z.string().describe('Password confirmation (must match password)'),
  firstName: z.string().describe('Customer first name'),
  lastName: z.string().describe('Customer last name'),
  salutation: z.string().optional().describe('Salutation (Mr, Mrs, Ms, Dr)'),
  gender: z.string().optional().describe('Gender (Male/Female) — required by some Spryker configurations'),
  acceptedTerms: z.boolean().default(true).describe('Whether the customer accepted the terms and conditions'),
});

async function registerCustomer(args: z.infer<typeof RegisterCustomerSchema>) {
  const apiService = SprykerApiService.getInstance();

  try {
    logger.info('Registering customer', { email: args.email });

    const response = await apiService.post('customers', {
      data: {
        type: 'customers',
        attributes: {
          ...(args.salutation ? { salutation: args.salutation } : {}),
          ...(args.gender ? { gender: args.gender } : {}),
          firstName: args.firstName,
          lastName: args.lastName,
          email: args.email,
          password: args.password,
          confirmPassword: args.confirmPassword,
          acceptedTerms: args.acceptedTerms,
        },
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: 'Customer registered successfully. Use the authenticate tool to log in.',
          customer: response.data,
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Register customer failed', error as Error);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: 'Failed to register customer',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          responseData: error instanceof ApiError ? error.responseData : [],
        }, null, 2),
      }],
      isError: true,
    };
  }
}

export const registerCustomerTool: SprykerTool = {
  name: 'register-customer',
  description: 'Register a new customer account.',
  inputSchema: z.toJSONSchema(RegisterCustomerSchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = RegisterCustomerSchema.parse(args);
    return await registerCustomer(validatedArgs);
  },
};
