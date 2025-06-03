/**
 * BaseServer Tests
 * 
 * Tests for the abstract BaseServer class functionality
 */

import { BaseServer } from '../../src/servers/base-server.js';
import { logger, LogLevel } from '../../src/utils/logger.js';
import { toolRegistry } from '../../src/tools/index.js';
import { promptRegistry } from '../../src/prompts/index.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema, 
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  SetLevelRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

// Mock external dependencies
jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    getLevel: jest.fn().mockReturnValue('info'),
    setLevel: jest.fn(),
  },
  LogLevel: {
    ERROR: 'error',
    WARN: 'warning',
    INFO: 'info',
    DEBUG: 'debug',
  }
}));

jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../src/tools/index.js', () => ({
  toolRegistry: {
    callTool: jest.fn(),
    registerAll: jest.fn(),
  }
}));

jest.mock('../../src/prompts/index.js', () => ({
  promptRegistry: {
    getMCPPrompts: jest.fn(),
    generatePromptContent: jest.fn(),
    get: jest.fn(),
  }
}));

// Create a concrete test implementation of BaseServer
class TestServer extends BaseServer {
  async start(): Promise<void> {
    return Promise.resolve();
  }

  async shutdown(): Promise<void> {
    return Promise.resolve();
  }

  // Expose protected server for testing
  getServer() {
    return this.server;
  }

  // Expose registerHandlers for testing
  public override registerHandlers() {
    super.registerHandlers();
  }
}

describe('BaseServer', () => {
  let testServer: TestServer;
  let mockLogger: jest.Mocked<typeof logger>;
  let mockToolRegistry: jest.Mocked<typeof toolRegistry>;
  let mockPromptRegistry: jest.Mocked<typeof promptRegistry>;
  let mockServer: jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLogger = logger as jest.Mocked<typeof logger>;
    mockToolRegistry = toolRegistry as jest.Mocked<typeof toolRegistry>;
    mockPromptRegistry = promptRegistry as jest.Mocked<typeof promptRegistry>;

    // Create mock server instance
    mockServer = {
      setRequestHandler: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (Server as jest.Mock).mockReturnValue(mockServer);
    
    testServer = new TestServer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create server instance with correct configuration', () => {
      expect(Server).toHaveBeenCalledWith(
        {
          name: 'spryker-mcp-server',
          version: '0.0.1',
        },
        {
          capabilities: {
            tools: {},
            prompts: {},
            logging: {},
          },
        }
      );
    });

    it('should register handlers during construction', () => {
      expect(mockLogger.info).toHaveBeenCalledWith('Registering MCP handlers...');
      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(4); // 4 handlers
      expect(mockToolRegistry.registerAll).toHaveBeenCalledWith(mockServer);
      expect(mockLogger.info).toHaveBeenCalledWith('MCP handlers registered successfully');
    });
  });

  describe('tool call handler', () => {
    let toolCallHandler: any;

    beforeEach(() => {
      // Get the tool call handler that was registered
      const setRequestHandlerCalls = mockServer.setRequestHandler.mock.calls;
      const toolCallHandlerCall = setRequestHandlerCalls.find((call: any) => 
        call[0] === CallToolRequestSchema
      );
      toolCallHandler = toolCallHandlerCall?.[1];
    });

    it('should handle successful tool call', async () => {
      const mockResult = {
        content: [{ type: 'text' as const, text: 'test result' }]
      };
      mockToolRegistry.callTool.mockResolvedValue(mockResult);

      const request = {
        params: {
          name: 'test-tool',
          arguments: { param1: 'value1' }
        }
      };

      const result = await toolCallHandler(request);

      expect(mockLogger.info).toHaveBeenCalledWith('Executing tool: test-tool', { args: { param1: 'value1' } });
      expect(mockToolRegistry.callTool).toHaveBeenCalledWith('test-tool', { param1: 'value1' });
      expect(mockLogger.info).toHaveBeenCalledWith('Tool test-tool executed successfully');
      expect(result).toBe(mockResult);
    });

    it('should handle tool call with no arguments', async () => {
      const mockResult = {
        content: [{ type: 'text' as const, text: 'success' }]
      };
      mockToolRegistry.callTool.mockResolvedValue(mockResult);

      const request = {
        params: {
          name: 'test-tool'
        }
      };

      const result = await toolCallHandler(request);

      expect(mockToolRegistry.callTool).toHaveBeenCalledWith('test-tool', {});
      expect(result).toBe(mockResult);
    });

    it('should handle tool call error', async () => {
      const mockError = new Error('Tool execution failed');
      mockToolRegistry.callTool.mockRejectedValue(mockError);

      const request = {
        params: {
          name: 'failing-tool',
          arguments: { param1: 'value1' }
        }
      };

      await expect(toolCallHandler(request)).rejects.toThrow('Tool execution failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Tool failing-tool execution failed:', mockError);
    });

    it('should handle non-Error exceptions', async () => {
      mockToolRegistry.callTool.mockRejectedValue('String error');

      const request = {
        params: {
          name: 'failing-tool'
        }
      };

      await expect(toolCallHandler(request)).rejects.toBe('String error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Tool failing-tool execution failed:', 
        expect.any(Error)
      );
    });
  });

  describe('prompt list handler', () => {
    let promptListHandler: any;

    beforeEach(() => {
      // Get the prompt list handler that was registered
      const setRequestHandlerCalls = mockServer.setRequestHandler.mock.calls;
      const promptListHandlerCall = setRequestHandlerCalls.find((call: any) => 
        call[0] === ListPromptsRequestSchema
      );
      promptListHandler = promptListHandlerCall?.[1];
    });

    it('should return list of prompts', async () => {
      const mockPrompts = [
        { name: 'prompt1', description: 'Test prompt 1' },
        { name: 'prompt2', description: 'Test prompt 2' }
      ];
      mockPromptRegistry.getMCPPrompts.mockReturnValue(mockPrompts);

      const result = await promptListHandler();

      expect(mockLogger.debug).toHaveBeenCalledWith('Received list_prompts request');
      expect(mockPromptRegistry.getMCPPrompts).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Returning 2 available prompts');
      expect(result).toEqual({ prompts: mockPrompts });
    });
  });

  describe('prompt get handler', () => {
    let promptGetHandler: any;

    beforeEach(() => {
      // Get the prompt get handler that was registered
      const setRequestHandlerCalls = mockServer.setRequestHandler.mock.calls;
      const promptGetHandlerCall = setRequestHandlerCalls.find((call: any) => 
        call[0] === GetPromptRequestSchema
      );
      promptGetHandler = promptGetHandlerCall?.[1];
    });

    it('should generate prompt content successfully', async () => {
      const mockContent = 'Generated prompt content';
      const mockPrompt = { 
        name: 'test-prompt',
        description: 'Test prompt description',
        arguments: [],
        template: 'Test template'
      };
      
      mockPromptRegistry.generatePromptContent.mockReturnValue(mockContent);
      mockPromptRegistry.get.mockReturnValue(mockPrompt);

      const request = {
        params: {
          name: 'test-prompt',
          arguments: { param1: 'value1' }
        }
      };

      const result = await promptGetHandler(request);

      expect(mockLogger.info).toHaveBeenCalledWith('Getting prompt: test-prompt', { args: { param1: 'value1' } });
      expect(mockPromptRegistry.generatePromptContent).toHaveBeenCalledWith('test-prompt', { param1: 'value1' });
      expect(mockLogger.info).toHaveBeenCalledWith('Prompt test-prompt generated successfully');
      expect(result).toEqual({
        description: 'Test prompt description',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: mockContent,
            },
          },
        ],
      });
    });

    it('should handle prompt with no arguments', async () => {
      const mockContent = 'Generated prompt content';
      const mockPrompt = { 
        name: 'test-prompt',
        description: 'Test prompt description',
        arguments: [],
        template: 'Test template'
      };
      
      mockPromptRegistry.generatePromptContent.mockReturnValue(mockContent);
      mockPromptRegistry.get.mockReturnValue(mockPrompt);

      const request = {
        params: {
          name: 'test-prompt'
        }
      };

      await promptGetHandler(request);

      expect(mockPromptRegistry.generatePromptContent).toHaveBeenCalledWith('test-prompt', {});
    });

    it('should handle prompt with no description', async () => {
      const mockContent = 'Generated prompt content';
      
      mockPromptRegistry.generatePromptContent.mockReturnValue(mockContent);
      mockPromptRegistry.get.mockReturnValue(undefined);

      const request = {
        params: {
          name: 'test-prompt'
        }
      };

      const result = await promptGetHandler(request);

      expect(result.description).toBe('');
    });

    it('should handle prompt generation error', async () => {
      const mockError = new Error('Prompt generation failed');
      mockPromptRegistry.generatePromptContent.mockImplementation(() => {
        throw mockError;
      });

      const request = {
        params: {
          name: 'failing-prompt',
          arguments: { param1: 'value1' }
        }
      };

      await expect(promptGetHandler(request)).rejects.toThrow('Prompt generation failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Prompt failing-prompt generation failed:', mockError);
    });

    it('should handle non-Error exceptions in prompt generation', async () => {
      mockPromptRegistry.generatePromptContent.mockImplementation(() => {
        throw 'String error';
      });

      const request = {
        params: {
          name: 'failing-prompt'
        }
      };

      await expect(promptGetHandler(request)).rejects.toBe('String error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Prompt failing-prompt generation failed:', 
        expect.any(Error)
      );
    });
  });

  describe('set level handler', () => {
    let setLevelHandler: any;

    beforeEach(() => {
      // Get the set level handler that was registered
      const setRequestHandlerCalls = mockServer.setRequestHandler.mock.calls;
      const setLevelHandlerCall = setRequestHandlerCalls.find((call: any) => 
        call[0] === SetLevelRequestSchema
      );
      setLevelHandler = setLevelHandlerCall?.[1];
    });

    it('should set log level successfully', async () => {
      mockLogger.getLevel.mockReturnValueOnce(LogLevel.INFO).mockReturnValueOnce(LogLevel.DEBUG);

      const request = {
        params: {
          level: 'debug'
        }
      };

      const result = await setLevelHandler(request);

      expect(mockLogger.info).toHaveBeenCalledWith('Setting log level to: debug');
      expect(mockLogger.setLevel).toHaveBeenCalledWith('debug');
      expect(mockLogger.info).toHaveBeenCalledWith('Log level successfully changed from info to debug');
      
      expect(result).toEqual({
        message: "Log level changed from 'info' to 'debug'",
        previousLevel: 'info',
        newLevel: 'debug',
        requestedLevel: 'debug',
        timestamp: expect.any(String)
      });
    });

    it('should handle set level error', async () => {
      const mockError = new Error('Failed to set level');
      mockLogger.setLevel.mockImplementation(() => {
        throw mockError;
      });

      const request = {
        params: {
          level: 'invalid'
        }
      };

      await expect(setLevelHandler(request)).rejects.toThrow('Failed to set level');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to set log level to invalid:', mockError);
    });

    it('should handle non-Error exceptions in set level', async () => {
      mockLogger.setLevel.mockImplementation(() => {
        throw 'String error';
      });

      const request = {
        params: {
          level: 'invalid'
        }
      };

      await expect(setLevelHandler(request)).rejects.toBe('String error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to set log level to invalid:', 
        expect.any(Error)
      );
    });
  });

  describe('abstract methods', () => {
    it('should require start method implementation', () => {
      expect(testServer.start).toBeDefined();
      expect(typeof testServer.start).toBe('function');
    });

    it('should require shutdown method implementation', () => {
      expect(testServer.shutdown).toBeDefined();
      expect(typeof testServer.shutdown).toBe('function');
    });
  });
});
