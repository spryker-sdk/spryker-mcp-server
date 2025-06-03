/**
 * Authentication Tool
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {ApiError, SprykerApiService} from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

const AuthenticateSchema = z.object({
  username: z.string().optional().describe('Customer username or email'),
  password: z.string().optional().describe('Customer password'),
});

async function authenticate(args: z.infer<typeof AuthenticateSchema>) {
  const apiService = SprykerApiService.getInstance();
  
  try {
    // For guest checkout, simply generate a guest customer unique ID
    if (!args.username || !args.password) {
      const guestId = `guest-${  Math.random().toString(36).substr(2, 9)  }-${  Date.now()}`;
      
      logger.info('Creating guest session', { guestId });
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            tokenType: 'Guest',
            accessToken: guestId,
            user_type: 'guest',
            message: 'Guest session created. Use this ID for cart and checkout operations.'
          }, null, 2),
        }],
      };
    }
    
    logger.info('Authenticating customer', { username: args.username });
    
    // Create access token request
    const response = await apiService.post<{
      data: {
        type: string;
        id: string;
        attributes: {
          tokenType: string;
          expiresIn: number;
          accessToken: string;
          refreshToken: string;
        };
      };
    }>('access-tokens', {
      data: {
        type: 'access-tokens',
        attributes: {
          grant_type: 'password',
          username: args.username!,
          password: args.password!,
        },
      },
    });

    if (response.status !== 201 && response.status !== 200) {
        logger.error('Authentication failed with status', { status: response.status, statusText: response.statusText });
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const tokenData = response.data.data.attributes;
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: 'Authentication successful',
          tokenType: tokenData.tokenType,
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresIn: tokenData.expiresIn,
          user_type: 'LoggedIn customer',
        }, null, 2),
      }],
    };
    
  } catch (error) {
    logger.error('Authentication failed', error as Error);
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: 'Authentication failed',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          responseData: error instanceof ApiError ? error.responseData : []
        }, null, 2),
      }],
      isError: true,
    };
  }
}

export const authenticateTool: SprykerTool = {
  name: 'authenticate',
  description: 'Authenticate a customer and get access token. Generate a guest token if no credentials are provided.',
  inputSchema: zodToJsonSchema(AuthenticateSchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = AuthenticateSchema.parse(args);
    return await authenticate(validatedArgs);
  },
};
