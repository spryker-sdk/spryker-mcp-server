/**
 * Tests for Tools Registry
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
        },
        spryker: {
            baseUrl: 'https://test-api.example.com',
            timeout: 5000
        }
    }
}));
import { ToolRegistry } from '../../src/tools/index.js';
describe('Tool Registry', () => {
    let toolRegistry;
    beforeEach(() => {
        toolRegistry = new ToolRegistry();
        // Register a simple test tool
        toolRegistry.registerTool({
            name: 'testTool',
            description: 'A test tool',
            inputSchema: {
                type: 'object',
                properties: {
                    input: { type: 'string' }
                },
                required: ['input']
            },
            handler: async (args) => {
                return {
                    content: [{
                            type: 'text',
                            text: `Processed: ${args.input}`
                        }]
                };
            }
        });
    });
    describe('tool registration', () => {
        it('should register and retrieve tools', () => {
            const tools = toolRegistry.getTools();
            expect(tools.length).toBe(1);
            expect(tools[0]?.name).toBe('testTool');
            expect(tools[0]?.description).toBe('A test tool');
        });
        it('should get individual tools', () => {
            const tool = toolRegistry.getTool('testTool');
            expect(tool).toBeDefined();
            expect(tool?.name).toBe('testTool');
        });
        it('should return undefined for unknown tools', () => {
            const tool = toolRegistry.getTool('unknownTool');
            expect(tool).toBeUndefined();
        });
    });
    describe('tool execution', () => {
        it('should execute registered tools', async () => {
            const result = await toolRegistry.callTool('testTool', { input: 'hello' });
            expect(result.content?.[0]?.text).toBe('Processed: hello');
        });
        it('should throw error for unknown tools', async () => {
            await expect(toolRegistry.callTool('unknownTool', {}))
                .rejects
                .toThrow('Unknown tool: unknownTool');
        });
    });
    describe('tool overwriting', () => {
        it('should allow overwriting existing tools', () => {
            // Register a tool with the same name
            toolRegistry.registerTool({
                name: 'testTool',
                description: 'Updated test tool',
                inputSchema: {
                    type: 'object',
                    properties: {}
                },
                handler: async (args) => {
                    return {
                        content: [{
                                type: 'text',
                                text: 'Updated response'
                            }]
                    };
                }
            });
            const tools = toolRegistry.getTools();
            expect(tools.length).toBe(1);
            expect(tools[0]?.description).toBe('Updated test tool');
        });
    });
});
//# sourceMappingURL=tools.test.js.map