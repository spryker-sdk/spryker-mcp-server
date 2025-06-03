/**
 * MCP Prompt Registry
 *
 * Manages registration and retrieval of prompts for the MCP server
 */
import { Prompt } from '@modelcontextprotocol/sdk/types.js';
import type { SprykerPrompt, PromptRegistry as IPromptRegistry } from './types.js';
/**
 * Prompt registry implementation
 */
export declare class PromptRegistry implements IPromptRegistry {
    prompts: Map<string, SprykerPrompt>;
    /**
     * Register a prompt
     */
    register(prompt: SprykerPrompt): void;
    /**
     * Get a specific prompt by name
     */
    get(name: string): SprykerPrompt | undefined;
    /**
     * Get all registered prompts
     */
    list(): SprykerPrompt[];
    /**
     * Get prompts in MCP format
     */
    getMCPPrompts(): Prompt[];
    /**
     * Generate prompt content with arguments
     */
    generatePromptContent(name: string, args: Record<string, unknown>): string;
}
/**
 * Global prompt registry instance
 */
export declare const promptRegistry: PromptRegistry;
//# sourceMappingURL=registry.d.ts.map