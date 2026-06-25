/**
 * Tool type definitions
 */
/**
 * Decide whether a tool should be exposed for the active business-model context.
 *
 * - A tool with no `availability` is always exposed.
 * - If `models` is set, the active business model must be included.
 * - If `marketplace` is true, the marketplace capability must be enabled.
 */
export function isToolAvailable(tool, ctx) {
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
//# sourceMappingURL=types.js.map