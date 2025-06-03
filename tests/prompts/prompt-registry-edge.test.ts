import { jest } from '@jest/globals';

// Mock logger - must be defined before import
const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

jest.mock('../../src/utils/logger', () => ({
  logger: mockLogger
}));

import { PromptRegistry } from '../../src/prompts/registry';

describe('Prompt Registry Edge Cases for Branch Coverage', () => {
  let registry: PromptRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    registry = new PromptRegistry();
  });

  describe('Error handling paths', () => {
    it('should handle prompt not found error in generatePromptContent', () => {
      expect(() => registry.generatePromptContent('non-existent-prompt', {}))
        .toThrow('Prompt not found: non-existent-prompt');
    });

    it('should handle duplicate prompt registration with warning', () => {
      const prompt1 = {
        name: 'duplicate-prompt',
        description: 'First version',
        arguments: [],
        template: 'Hello {{name}}'
      };

      const prompt2 = {
        name: 'duplicate-prompt',
        description: 'Second version',
        arguments: [],
        template: 'Hi {{name}}'
      };

      // Register first prompt
      registry.register(prompt1);
      expect(mockLogger.debug).toHaveBeenCalledWith('Registered prompt: duplicate-prompt');

      // Registering duplicate should show warning and overwrite
      registry.register(prompt2);
      expect(mockLogger.warn).toHaveBeenCalledWith('Prompt duplicate-prompt is already registered, overwriting');

      const retrievedPrompt = registry.get('duplicate-prompt');
      expect(retrievedPrompt?.description).toBe('Second version');
      expect(retrievedPrompt?.template).toBe('Hi {{name}}');
    });

    it('should handle template substitution with undefined values', () => {
      const prompt = {
        name: 'template-prompt',
        description: 'Template test',
        arguments: [
          { name: 'name', description: 'Name parameter', required: true },
          { name: 'optional', description: 'Optional parameter', required: false }
        ],
        template: 'Hello {{name}}{{#if optional}} - {{optional}}{{/if}}'
      };

      registry.register(prompt);

      // Test with undefined optional parameter
      const result = registry.generatePromptContent('template-prompt', { 
        name: 'John',
        optional: undefined 
      });

      expect(result).toBe('Hello John');
    });

    it('should handle template substitution with null values', () => {
      const prompt = {
        name: 'null-template-prompt',
        description: 'Null template test',
        arguments: [
          { name: 'name', description: 'Name parameter', required: true },
          { name: 'optional', description: 'Optional parameter', required: false }
        ],
        template: 'Hello {{name}}{{#if optional}} - {{optional}}{{/if}}'
      };

      registry.register(prompt);

      // Test with null optional parameter
      const result = registry.generatePromptContent('null-template-prompt', { 
        name: 'Jane',
        optional: null 
      });

      expect(result).toBe('Hello Jane');
    });

    it('should handle complex template with multiple conditionals', () => {
      const prompt = {
        name: 'complex-template',
        description: 'Complex template test',
        arguments: [
          { name: 'title', description: 'Title', required: false },
          { name: 'name', description: 'Name', required: true },
          { name: 'suffix', description: 'Suffix', required: false }
        ],
        template: '{{#if title}}{{title}} {{/if}}{{name}}{{#if suffix}} {{suffix}}{{/if}}'
      };

      registry.register(prompt);

      // Test with all parameters
      let result = registry.generatePromptContent('complex-template', { 
        title: 'Mr.',
        name: 'Smith',
        suffix: 'Jr.'
      });
      expect(result).toBe('Mr. Smith Jr.');

      // Test with only name
      result = registry.generatePromptContent('complex-template', { 
        name: 'Smith'
      });
      expect(result).toBe('Smith');

      // Test with name and title only
      result = registry.generatePromptContent('complex-template', { 
        title: 'Dr.',
        name: 'Smith'
      });
      expect(result).toBe('Dr. Smith');
    });

    it('should clean up extra blank lines in template output', () => {
      const prompt = {
        name: 'multiline-template',
        description: 'Multiline template test',
        arguments: [
          { name: 'section1', description: 'First section', required: false },
          { name: 'section2', description: 'Second section', required: false }
        ],
        template: `Line 1

{{#if section1}}
{{section1}}

{{/if}}

{{#if section2}}
{{section2}}

{{/if}}

Final line`
      };

      registry.register(prompt);

      // Test with no sections (should clean up extra blank lines)
      const result = registry.generatePromptContent('multiline-template', {});
      expect(result).not.toContain('\n\n\n');
      expect(result).toContain('Line 1');
      expect(result).toContain('Final line');
    });
  });

  describe('Registry state management', () => {
    it('should handle multiple registrations and maintain state', () => {
      const prompts = [
        { 
          name: 'prompt1', 
          description: 'First', 
          arguments: [], 
          template: 'Template 1' 
        },
        { 
          name: 'prompt2', 
          description: 'Second', 
          arguments: [], 
          template: 'Template 2' 
        },
        { 
          name: 'prompt3', 
          description: 'Third', 
          arguments: [], 
          template: 'Template 3' 
        }
      ];

      prompts.forEach(prompt => registry.register(prompt));

      const registeredPrompts = registry.list();
      expect(registeredPrompts).toHaveLength(3);

      const names = registeredPrompts.map(p => p.name);
      expect(names).toContain('prompt1');
      expect(names).toContain('prompt2');
      expect(names).toContain('prompt3');
    });

    it('should convert prompts to MCP format correctly', () => {
      const prompt = {
        name: 'mcp-test-prompt',
        description: 'Test prompt for MCP conversion',
        arguments: [
          { name: 'param1', description: 'First parameter', required: true },
          { name: 'param2', description: 'Second parameter', required: false }
        ],
        template: 'Test template'
      };

      registry.register(prompt);

      const mcpPrompts = registry.getMCPPrompts();
      expect(mcpPrompts).toHaveLength(1);

      const mcpPrompt = mcpPrompts[0]!;
      expect(mcpPrompt).toBeDefined();
      expect(mcpPrompt.name).toBe('mcp-test-prompt');
      expect(mcpPrompt.description).toBe('Test prompt for MCP conversion');
      expect(mcpPrompt.arguments).toBeDefined();
      expect(mcpPrompt.arguments!).toHaveLength(2);
      expect(mcpPrompt.arguments![0]).toEqual({
        name: 'param1',
        description: 'First parameter',
        required: true
      });
      expect(mcpPrompt.arguments![1]).toEqual({
        name: 'param2',
        description: 'Second parameter',
        required: false
      });
    });

    it('should handle empty registry', () => {
      expect(registry.list()).toHaveLength(0);
      expect(registry.getMCPPrompts()).toHaveLength(0);
      expect(registry.get('non-existent')).toBeUndefined();
    });

    it('should handle prompt retrieval by name', () => {
      const prompt = {
        name: 'test-get-prompt',
        description: 'Test get method',
        arguments: [],
        template: 'Test template'
      };

      registry.register(prompt);

      const retrieved = registry.get('test-get-prompt');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('test-get-prompt');

      const notFound = registry.get('does-not-exist');
      expect(notFound).toBeUndefined();
    });
  });
});
