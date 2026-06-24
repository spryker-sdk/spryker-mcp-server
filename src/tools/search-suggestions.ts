/**
 * Search Suggestions Tool
 *
 * Returns autocomplete suggestions (completion terms, products, categories)
 * for a partial search query.
 */

import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
import type { SprykerTool } from './types.js';

const SearchSuggestionsSchema = z.object({
  q: z.string().describe('Partial search query to get suggestions for'),
});

async function searchSuggestions(args: z.infer<typeof SearchSuggestionsSchema>) {
  const apiService = SprykerApiService.getInstance();

  try {
    logger.info('Retrieving search suggestions', { q: args.q });

    const params = new URLSearchParams({ q: args.q }).toString();

    const response = await apiService.get<{
      data: Array<{ type: string; id: string | null; attributes: Record<string, unknown> }>;
    }>(`catalog-search-suggestions?${params}`);

    const data = response.data.data;
    const suggestions = Array.isArray(data) ? data : data ? [data] : [];

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: response.status === 200,
          message: 'Search suggestions retrieved successfully',
          query: args.q,
          suggestions: suggestions.map(item => ({ id: item.id, attributes: item.attributes })),
        }, null, 2),
      }],
    };
  } catch (error) {
    logger.error('Search suggestions failed', error as Error);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: 'Failed to retrieve search suggestions',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          responseData: error instanceof ApiError ? error.responseData : [],
          query: args.q,
        }, null, 2),
      }],
      isError: true,
    };
  }
}

export const searchSuggestionsTool: SprykerTool = {
  name: 'search-suggestions',
  description: 'Get autocomplete search suggestions (completion terms, products, categories) for a partial query.',
  inputSchema: z.toJSONSchema(SearchSuggestionsSchema) as any,
  handler: async (args: Record<string, unknown>) => {
    const validatedArgs = SearchSuggestionsSchema.parse(args);
    return await searchSuggestions(validatedArgs);
  },
};
