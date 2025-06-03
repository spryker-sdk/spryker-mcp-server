/**
 * Base server functionality shared across all transport types
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema, 
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  SetLevelRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { toolRegistry } from '../tools/index.js';
import { promptRegistry } from '../prompts/index.js';

/**
 * Base server class with common functionality
 */
export abstract class BaseServer {
  protected server: Server;

  constructor() {
    this.server = new Server(
      {
        name: config.server.name,
        version: config.server.version,
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          logging: {},
        },
      }
    );

    this.registerHandlers();
  }

  /**
   * Register all MCP handlers on the server instance
   */
  protected registerHandlers(): void {
    logger.info('Registering MCP handlers...');

    // Register tool call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      logger.info(`Executing tool: ${name}`, { args });
      
      try {
        const result = await toolRegistry.callTool(name, args || {});
        logger.info(`Tool ${name} executed successfully`);
        return result;
      } catch (error) {
        logger.error(`Tool ${name} execution failed:`, 
          error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });

    // Register prompt list handler
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      logger.debug('Received list_prompts request');
      
      const prompts = promptRegistry.getMCPPrompts();
      logger.info(`Returning ${prompts.length} available prompts`);
      
      return { prompts };
    });

    // Register prompt get handler
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      logger.info(`Getting prompt: ${name}`, { args });
      
      try {
        const content = promptRegistry.generatePromptContent(name, args || {});
        logger.info(`Prompt ${name} generated successfully`);

        return {
          description: promptRegistry.get(name)?.description || '',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: content,
              },
            },
          ],
        };
      } catch (error) {
        logger.error(`Prompt ${name} generation failed:`, 
          error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });

    // Register logging set level handler
    this.server.setRequestHandler(SetLevelRequestSchema, async (request) => {
      const { level } = request.params;
      
      logger.info(`Setting log level to: ${level}`);
      
      try {
        const previousLevel = logger.getLevel();
        logger.setLevel(level);
        const newLevel = logger.getLevel();
        
        logger.info(`Log level successfully changed from ${previousLevel} to ${newLevel}`);
        
        return {
          message: `Log level changed from '${previousLevel}' to '${newLevel}'`,
          previousLevel,
          newLevel,
          requestedLevel: level,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        logger.error(`Failed to set log level to ${level}:`, 
          error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });

    // Register all tools (this will handle ListToolsRequestSchema)
    toolRegistry.registerAll(this.server);
    
    logger.info('MCP handlers registered successfully');
  }

  /**
   * Start the server (to be implemented by subclasses)
   */
  abstract start(): Promise<void>;

  /**
   * Shutdown the server (to be implemented by subclasses)
   */
  abstract shutdown(): Promise<void>;
}
