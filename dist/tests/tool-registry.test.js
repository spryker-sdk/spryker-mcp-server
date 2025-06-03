/**
 * Basic smoke test for the tool registry
 */
/// <reference types="jest" />
import { ToolRegistry } from '../src/tools/index';
describe('ToolRegistry', () => {
    let registry;
    beforeEach(() => {
        registry = new ToolRegistry();
    });
    test('should be instantiable', () => {
        expect(registry).toBeDefined();
        expect(registry).toBeInstanceOf(ToolRegistry);
    });
    test('should have no tools initially', () => {
        const tools = registry.getTools();
        expect(tools).toHaveLength(0);
    });
    test('should register a tool', () => {
        const mockTool = {
            name: 'test_tool',
            description: 'A test tool',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
            handler: jest.fn().mockResolvedValue({
                content: [{ type: 'text', text: 'test result' }],
            }),
        };
        registry.registerTool(mockTool);
        const tools = registry.getTools();
        expect(tools).toHaveLength(1);
        expect(tools[0]).toBeDefined();
        expect(tools[0].name).toBe('test_tool');
    });
    test('should retrieve a registered tool', () => {
        const mockTool = {
            name: 'test_tool',
            description: 'A test tool',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
            handler: jest.fn().mockResolvedValue({
                content: [{ type: 'text', text: 'test result' }],
            }),
        };
        registry.registerTool(mockTool);
        const retrievedTool = registry.getTool('test_tool');
        expect(retrievedTool).toBeDefined();
        expect(retrievedTool?.name).toBe('test_tool');
    });
    test('should return undefined for non-existent tool', () => {
        const retrievedTool = registry.getTool('nonexistent');
        expect(retrievedTool).toBeUndefined();
    });
});
//# sourceMappingURL=tool-registry.test.js.map