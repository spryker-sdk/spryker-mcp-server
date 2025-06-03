/**
 * Product Search Tool
 *
 * Searches for products in the Spryker catalog using various filters
 * and search criteria.
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
/**
 * Input schema for product search
 */
const ProductSearchSchema = z.object({
    q: z.string().optional().describe('Search query text'),
    rangeFacets: z.array(z.object({
        name: z.string().describe('Range facet name'),
        min: z.number().optional().describe('Minimum value'),
        max: z.number().optional().describe('Maximum value'),
    })).optional().describe('Range facet values. This can be used for price ranges or other numeric filters. Multiple values can be specified only if filter has flag isMultiValued = true.'),
    valueFacets: z.array(z.object({
        name: z.string().describe('Exact value facet name'),
        value: z.string().describe('Exact value facet value'),
    })).optional().describe('Exact value facet filters. This can be used for by filtering by labels, brands etc. Multiple values can be specified only if filter has flag isMultiValued = true.'),
    sort: z.string().describe('Sort parameter name to use for sorting results').optional(),
    ipp: z.number().min(1).max(100).default(20).describe('Number of results to return'),
    page: z.number().min(0).default(0).describe('Result offset for pagination'),
});
/**
 * Product search implementation
 */
async function searchProducts(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Searching products', args);
        // Build query parameters matching Spryker API format
        const queryParams = {};
        // Build the main query
        if (args.q && args.q.trim() !== '*') {
            queryParams.q = args.q;
        }
        else {
            queryParams.q = '';
        }
        // Add pagination parameters
        queryParams['ipp'] = args.ipp.toString();
        queryParams['page'] = args.page.toString();
        // Add sorting parameter if specified
        if (args.sort) {
            queryParams['sort'] = args.sort.toString();
        }
        // Add exact facet filters
        if (args.valueFacets && args.valueFacets.length > 0) {
            args.valueFacets.forEach((facet) => {
                const facetName = facet.name.toString();
                if (queryParams[facetName] !== undefined) {
                    if (!Array.isArray(queryParams[facetName])) {
                        const facetValue = queryParams[facetName];
                        queryParams[facetName] = [facetValue]; // Convert to array if already exists
                    }
                    // Add new value to existing array
                    queryParams[facetName].push(facet.value.toString());
                    return;
                }
                queryParams[facetName] = facet.value.toString();
            });
        }
        // Add range facet filters
        if (args.rangeFacets && args.rangeFacets.length > 0) {
            args.rangeFacets.forEach((facet) => {
                if (facet.min !== undefined) {
                    queryParams[`${facet.name.toString()}[min]`] = facet.min.toString();
                }
                if (facet.max !== undefined) {
                    queryParams[`${facet.name.toString()}[max]`] = facet.max.toString();
                }
            });
        }
        // Make API request using the general request method
        const response = await apiService.request('GET', 'catalog-search', { params: queryParams });
        logger.info('Raw API Response received', {
            hasData: !!response.data,
            dataKeys: response.data ? Object.keys(response.data) : [],
            dataType: Array.isArray(response.data.data) ? 'array' : typeof response.data.data,
            dataLength: Array.isArray(response.data.data) ? response.data.data.length : 'not array'
        });
        // Check if data exists and contains search results
        if (!response.data.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            error: 'No search results found',
                            products: [],
                            pagination: { total: 0, count: 0, ipp: args.ipp, limit: args.page },
                            query: args,
                        }, null, 2),
                    }],
            };
        }
        const searchResult = response.data.data[0];
        if (!searchResult?.attributes) {
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            error: 'Invalid search result structure',
                            products: [],
                            pagination: { total: 0, count: 0, ipp: args.ipp, limit: args.page },
                            sort: [],
                            valueFacets: [],
                            rangeFacets: [],
                            query: args,
                        }, null, 2),
                    }],
            };
        }
        const abstractProducts = searchResult.attributes.abstractProducts || [];
        const products = abstractProducts.map(item => ({
            sku: item.abstractSku,
            name: item.abstractName,
            price: item.price,
            priceFormatted: item.prices?.[0] ?
                `${item.prices[0].grossAmount / 100} ${item.prices[0].currency.symbol}` :
                `${item.price / 100} EUR`,
            images: item.images,
        }));
        const pagination = searchResult.attributes.pagination;
        logger.info(`Found ${products.length} products`, {
            total: pagination?.numFound,
            page: pagination?.currentPage
        });
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        products,
                        pagination: {
                            total: pagination?.numFound || 0,
                            count: products.length,
                            ipp: args.ipp,
                            page: args.page,
                            currentPage: pagination?.currentPage || 1,
                            maxPage: pagination?.maxPage || 1,
                        },
                        sort: searchResult.attributes.sort || [],
                        valueFacets: searchResult.attributes.valueFacets || [],
                        rangeFacets: searchResult.attributes.rangeFacets || [],
                        query: args,
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Product search failed', error);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: 'Product search failed',
                        message: error instanceof Error ? error.message : 'Unknown error occurred',
                        responseData: error instanceof ApiError ? error.responseData : [],
                        products: [],
                        pagination: { total: 0, count: 0, ipp: args.ipp, page: args.page },
                        sort: [],
                        valueFacets: [],
                        rangeFacets: [],
                        query: args,
                    }, null, 2),
                }],
        };
    }
}
/**
 * Product search tool definition
 */
export const productSearchTool = {
    name: 'product-search',
    description: 'Search for abstract products catalog with filters and pagination',
    inputSchema: zodToJsonSchema(ProductSearchSchema),
    handler: async (args) => {
        const validatedArgs = ProductSearchSchema.parse(args);
        return await searchProducts(validatedArgs);
    },
};
//# sourceMappingURL=product-search.js.map