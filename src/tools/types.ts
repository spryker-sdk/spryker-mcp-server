/**
 * Tool type definitions
 */

/**
 * Spryker business models. Marketplace is modeled separately as a capability
 * (it overlays either B2C or B2B), not as its own business model.
 */
export type BusinessModel = 'b2c' | 'b2b';

/**
 * Declares which business model(s) / capabilities a tool applies to.
 * Omit `availability` entirely on a tool to make it available in every model.
 */
export interface ToolAvailability {
  /** Business models this tool applies to. Omit for "all models". */
  models?: BusinessModel[];
  /** When true, the tool is only exposed if the marketplace capability is enabled. */
  marketplace?: boolean;
}

/**
 * The active business-model context the server runs in.
 */
export interface BusinessModelContext {
  businessModel: BusinessModel;
  marketplaceEnabled: boolean;
}

export interface SprykerTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, object>;
    required?: string[];
  };
  /** Business-model availability. Omit to expose the tool in every model. */
  availability?: ToolAvailability;
  handler: (args: Record<string, unknown>) => Promise<{
    content: Array<{
      type: 'text';
      text: string;
    }>;
  }>;
}

/**
 * Decide whether a tool should be exposed for the active business-model context.
 *
 * - A tool with no `availability` is always exposed.
 * - If `models` is set, the active business model must be included.
 * - If `marketplace` is true, the marketplace capability must be enabled.
 */
export function isToolAvailable(
  tool: Pick<SprykerTool, 'availability'>,
  ctx: BusinessModelContext
): boolean {
  const availability = tool.availability;
  if (!availability) {
    return true;
  }
  if (availability.models && !availability.models.includes(ctx.businessModel)) {
    return false;
  }
  if (availability.marketplace && !ctx.marketplaceEnabled) {
    return false;
  }
  return true;
}
