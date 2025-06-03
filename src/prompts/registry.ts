/**
 * MCP Prompt Registry
 * 
 * Manages registration and retrieval of prompts for the MCP server
 */

import { Prompt } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
import type { SprykerPrompt, PromptRegistry as IPromptRegistry } from './types.js';

/**
 * Convert SprykerPrompt to MCP Prompt format
 */
function convertToMCPPrompt(sprykerPrompt: SprykerPrompt): Prompt {
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
export class PromptRegistry implements IPromptRegistry {
  public prompts: Map<string, SprykerPrompt> = new Map();

  /**
   * Register a prompt
   */
  register(prompt: SprykerPrompt): void {
    if (this.prompts.has(prompt.name)) {
      logger.warn(`Prompt ${prompt.name} is already registered, overwriting`);
    }

    this.prompts.set(prompt.name, prompt);
    logger.debug(`Registered prompt: ${prompt.name}`);
  }

  /**
   * Get a specific prompt by name
   */
  get(name: string): SprykerPrompt | undefined {
    return this.prompts.get(name);
  }

  /**
   * Get all registered prompts
   */
  list(): SprykerPrompt[] {
    return Array.from(this.prompts.values());
  }

  /**
   * Get prompts in MCP format
   */
  getMCPPrompts(): Prompt[] {
    return this.list().map(convertToMCPPrompt);
  }

  /**
   * Generate prompt content with arguments
   */
  generatePromptContent(name: string, args: Record<string, unknown>): string {
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
      } else {
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
