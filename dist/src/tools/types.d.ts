/**
 * Tool type definitions
 */
export interface SprykerTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
    handler: (args: Record<string, unknown>) => Promise<{
        content: Array<{
            type: 'text';
            text: string;
        }>;
    }>;
}
//# sourceMappingURL=types.d.ts.map