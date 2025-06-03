/**
 * Tests for Authenticate Tool
 */
// Mock config first
jest.mock('../../src/config/index.js', () => ({
    config: {
        server: {
            logLevel: 'info'
        },
        api: {
            baseUrl: 'https://test-api.example.com',
            timeout: 5000,
            retryAttempts: 3,
            retryDelay: 1000
        }
    }
}));
// Mock logger
jest.mock('../../src/utils/logger.js', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn()
    }
}));
import { authenticateTool } from '../../src/tools/authenticate.js';
import { ApiError } from '../../src/services/spryker-api.js';
// Mock the API service
const mockPost = jest.fn();
jest.mock('../../src/services/spryker-api.js', () => ({
    SprykerApiService: {
        getInstance: () => ({
            post: mockPost
        })
    },
    ApiError: class ApiError extends Error {
        status;
        responseData;
        constructor(message, status, responseData = {}) {
            super(message);
            this.status = status;
            this.responseData = responseData;
            this.name = 'ApiError';
        }
    }
}));
describe('Authenticate Tool', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('guest authentication', () => {
        it('should create guest session when no credentials provided', async () => {
            const result = await authenticateTool.handler({});
            expect(result.content).toHaveLength(1);
            expect(result.content[0]?.text).toContain('"success": true');
            expect(result.content[0]?.text).toContain('"tokenType": "Guest"');
            expect(result.content[0]?.text).toContain('"accessToken": "guest-');
            expect(result.content[0]?.text).toContain('"user_type": "guest"');
            expect(result.content[0]?.text).toContain('"message": "Guest session created. Use this ID for cart and checkout operations."');
        });
        it('should create guest session when only username provided', async () => {
            const result = await authenticateTool.handler({
                username: 'test@example.com'
            });
            expect(result.content).toHaveLength(1);
            expect(result.content[0]?.text).toContain('"success": true');
            expect(result.content[0]?.text).toContain('"tokenType": "Guest"');
            expect(result.content[0]?.text).toContain('"accessToken": "guest-');
            expect(result.content[0]?.text).toContain('"user_type": "guest"');
        });
        it('should create guest session when only password provided', async () => {
            const result = await authenticateTool.handler({
                password: 'password123'
            });
            expect(result.content).toHaveLength(1);
            expect(result.content[0]?.text).toContain('"success": true');
            expect(result.content[0]?.text).toContain('"tokenType": "Guest"');
            expect(result.content[0]?.text).toContain('"accessToken": "guest-');
            expect(result.content[0]?.text).toContain('"user_type": "guest"');
        });
    });
    describe('customer authentication', () => {
        it('should authenticate customer with valid credentials', async () => {
            const mockResponse = {
                status: 200,
                data: {
                    data: {
                        type: 'access-tokens',
                        id: 'token-123',
                        attributes: {
                            tokenType: 'Bearer',
                            expiresIn: 3600,
                            accessToken: 'access-token-123',
                            refreshToken: 'refresh-token-123'
                        }
                    }
                }
            };
            mockPost.mockResolvedValueOnce(mockResponse);
            const result = await authenticateTool.handler({
                username: 'test@example.com',
                password: 'password123'
            });
            expect(mockPost).toHaveBeenCalledWith('access-tokens', {
                data: {
                    type: 'access-tokens',
                    attributes: {
                        grant_type: 'password',
                        username: 'test@example.com',
                        password: 'password123'
                    }
                }
            });
            expect(result.content).toHaveLength(1);
            expect(result.content[0]?.text).toContain('"success": true');
            expect(result.content[0]?.text).toContain('"user_type": "LoggedIn customer"');
            expect(result.content[0]?.text).toContain('"accessToken": "access-token-123"');
            expect(result.content[0]?.text).toContain('"expiresIn": 3600');
        });
        it('should handle authentication failure', async () => {
            const apiError = new ApiError('Invalid credentials', 401);
            mockPost.mockRejectedValueOnce(apiError);
            const result = await authenticateTool.handler({
                username: 'invalid@example.com',
                password: 'wrongpassword'
            });
            expect(result.content).toHaveLength(1);
            expect(result.content[0]?.text).toContain('"success": false');
            expect(result.content[0]?.text).toContain('"error": "Authentication failed"');
            expect(result.content[0]?.text).toContain('"message": "Invalid credentials"');
        });
        it('should handle network errors during authentication', async () => {
            const networkError = new Error('Network failure');
            mockPost.mockRejectedValueOnce(networkError);
            const result = await authenticateTool.handler({
                username: 'test@example.com',
                password: 'password123'
            });
            expect(result.content).toHaveLength(1);
            expect(result.content[0]?.text).toContain('"success": false');
            expect(result.content[0]?.text).toContain('"error": "Authentication failed"');
            expect(result.content[0]?.text).toContain('"message": "Network failure"');
        });
    });
    describe('tool configuration', () => {
        it('should have proper tool definition', () => {
            expect(authenticateTool.name).toBe('authenticate');
            expect(authenticateTool.description).toContain('Authenticate a customer');
            expect(typeof authenticateTool.handler).toBe('function');
            expect(authenticateTool.inputSchema).toBeDefined();
            expect(authenticateTool.inputSchema.type).toBe('object');
        });
    });
});
//# sourceMappingURL=authenticate.test.js.map