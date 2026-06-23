/**
 * Refresh Token Tool
 *
 * Exchanges a refresh token for a new access token.
 */
import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
const RefreshTokenSchema = z.object({
    refreshToken: z.string().describe('Refresh token obtained from a previous authentication'),
});
async function refreshToken(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Refreshing access token');
        const response = await apiService.post('refresh-tokens', {
            data: {
                type: 'refresh-tokens',
                attributes: { refreshToken: args.refreshToken },
            },
        });
        const tokenData = response.data.data.attributes;
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: 'Access token refreshed successfully',
                        tokenType: tokenData.tokenType,
                        accessToken: tokenData.accessToken,
                        refreshToken: tokenData.refreshToken,
                        expiresIn: tokenData.expiresIn,
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Refresh token failed', error);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Failed to refresh access token',
                        message: error instanceof Error ? error.message : 'Unknown error occurred',
                        responseData: error instanceof ApiError ? error.responseData : [],
                    }, null, 2),
                }],
            isError: true,
        };
    }
}
export const refreshTokenTool = {
    name: 'refresh-token',
    description: 'Exchange a refresh token for a new access token.',
    inputSchema: z.toJSONSchema(RefreshTokenSchema),
    handler: async (args) => {
        const validatedArgs = RefreshTokenSchema.parse(args);
        return await refreshToken(validatedArgs);
    },
};
//# sourceMappingURL=refresh-token.js.map