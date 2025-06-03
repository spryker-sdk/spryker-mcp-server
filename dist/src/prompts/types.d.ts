/**
 * Types for MCP Prompts
 */
export interface PromptArgument {
    name: string;
    description: string;
    required: boolean;
}
export interface SprykerPrompt {
    name: string;
    description: string;
    arguments: PromptArgument[];
    template: string;
}
export interface PromptRegistry {
    prompts: Map<string, SprykerPrompt>;
    register(prompt: SprykerPrompt): void;
    get(name: string): SprykerPrompt | undefined;
    list(): SprykerPrompt[];
}
//# sourceMappingURL=types.d.ts.map