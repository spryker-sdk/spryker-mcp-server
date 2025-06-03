/**
 * Prompts Module
 * 
 * Exports all prompts and the prompt registry
 */

// Import all prompt definitions
import { productSearchPrompt } from './product-search.js';
import { cartManagementPrompt } from './cart-management.js';
import { customerServicePrompt } from './customer-service.js';
import { orderFulfillmentPrompt } from './order-fulfillment.js';
import { productRecommendationsPrompt } from './product-recommendations.js';

// Import registry
import { promptRegistry, PromptRegistry } from './registry.js';
import { logger } from '../utils/logger.js';

// Register all prompts
function registerAllPrompts(): void {
  logger.info('Registering MCP prompts...');

  const prompts = [
    productSearchPrompt,
    cartManagementPrompt,
    customerServicePrompt,
    orderFulfillmentPrompt,
    productRecommendationsPrompt,
  ];

  prompts.forEach(prompt => promptRegistry.register(prompt));
  
  logger.info(`Successfully registered ${prompts.length} prompts`);
}

// Auto-register prompts when module is imported
registerAllPrompts();

// Export everything
export { promptRegistry, PromptRegistry };
export type { SprykerPrompt, PromptArgument, PromptRegistry as IPromptRegistry } from './types.js';
export {
  productSearchPrompt,
  cartManagementPrompt,
  customerServicePrompt,
  orderFulfillmentPrompt,
  productRecommendationsPrompt,
};
