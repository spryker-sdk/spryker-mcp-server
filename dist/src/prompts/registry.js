/**
 * MCP Prompt Registry
 *
 * Manages registration and retrieval of prompts for the MCP server
 */
import { logger } from '../utils/logger.js';
/**
 * Convert SprykerPrompt to MCP Prompt format
 */
function convertToMCPPrompt(sprykerPrompt) {
    return {
        name: sprykerPrompt.name,
        description: sprykerPrompt.description,
        arguments: sprykerPrompt.arguments.map(arg => ({
            name: arg.name,
            description: arg.description,
            required: arg.required,
        })),
    };
}
/**
 * Prompt registry implementation
 */
export class PromptRegistry {
    prompts = new Map();
    /**
     * Register a prompt
     */
    register(prompt) {
        if (this.prompts.has(prompt.name)) {
            logger.warn(`Prompt ${prompt.name} is already registered, overwriting`);
        }
        this.prompts.set(prompt.name, prompt);
        logger.debug(`Registered prompt: ${prompt.name}`);
    }
    /**
     * Get a specific prompt by name
     */
    get(name) {
        return this.prompts.get(name);
    }
    /**
     * Get all registered prompts
     */
    list() {
        return Array.from(this.prompts.values());
    }
    /**
     * Get prompts in MCP format
     */
    getMCPPrompts() {
        return this.list().map(convertToMCPPrompt);
    }
    /**
     * Generate prompt content with arguments
     */
    generatePromptContent(name, args) {
        const prompt = this.get(name);
        if (!prompt) {
            throw new Error(`Prompt not found: ${name}`);
        }
        // Simple template substitution (could be enhanced with a proper template engine)
        let content = prompt.template;
        // Replace Handlebars-style variables
        for (const [key, value] of Object.entries(args)) {
            if (value !== undefined && value !== null) {
                // Replace {{key}} with value
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                content = content.replace(regex, String(value));
                // Handle {{#if key}} blocks
                const ifRegex = new RegExp(`{{#if\\s+${key}}}([\\s\\S]*?){{/if}}`, 'g');
                content = content.replace(ifRegex, '$1');
            }
            else {
                // Remove {{#if key}} blocks when key is not provided
                const ifRegex = new RegExp(`{{#if\\s+${key}}}[\\s\\S]*?{{/if}}`, 'g');
                content = content.replace(ifRegex, '');
            }
        }
        // Clean up any remaining template syntax
        content = content.replace(/{{[^}]*}}/g, '');
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n'); // Remove extra blank lines
        return content.trim();
    }
}
/**
 * Global prompt registry instance
 */
export const promptRegistry = new PromptRegistry();
//# sourceMappingURL=registry.js.map