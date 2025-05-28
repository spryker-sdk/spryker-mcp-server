// tools/searchProducts.js
import {z} from 'zod';
import {BaseTool} from '../utils/baseTool.js';
import sprykerApi from '../services/sprykerApiService.js';
import {formatErrorResponse, formatSuccessResponse} from '../utils/responseFormatter.js';

const searchProductsHandler = async ({search, limit, label, color, brand, category, offset, sort, price_min, price_max}) => {
    try {
        if (!search || search.trim() === '*') {
            search = '';
        }
        let params = {q: search, page: {limit, offset}};

        if (label) {
            params.label = label;
        }
        if (color) {
            params.color = color;
        }
        if (brand) {
            params.brand = brand;
        }
        if (category) {
            params.category = category;
        }
        // Add sort and price filters if provided
        params.sort = {};
        if (sort) {
            params.sort = sort;
        }
        if (price_min !== undefined) {
            params.price_min = price_min;
        }
        if (price_max !== undefined) {
            params.price_max = price_max;
        }

        const response = await sprykerApi.get(
            'catalog-search',
            params
        );
        return formatSuccessResponse(response.data);
    } catch (error) {
        return formatErrorResponse(error, 'searching products');
    }
};

export default function registerTool(server) {
    const tool = new BaseTool(
        'searchProducts',
        'Fetches abstract products based on search criteria and pagination parameters',
        {
            search: z.string().optional().describe('Search query for products, can be empty or "*" for all products. Use it only if you want to search by name, description, or SKU.'),
            sort: z.string().optional().describe('Sorting criteria: rating, name_asc, name_desc, price_asc, price_desc'),
            label: z.string().optional().describe('Filter products by Label attribute: Sales %, New'),
            color: z.string().optional().describe('Filter products by Color attribute: e.g., "red", "blue", "green"'),
            brand: z.string().optional().describe('Filter products by Brand attribute, e.g., "Nike", "Adidas", "Samsung" or "Apple"'),
            category: z.string().optional().describe('Filter products by Category attribute: e.g., "electronics", "clothing", "books"'),
            price_min: z.number().optional().describe('Filter products with price in cents greater than or equal to this value'),
            price_max: z.number().optional().describe('Filter products with price in cents less than or equal to this value'),
            limit: z.number().optional().default(10).describe('Number of products to return'),
            offset: z.number().optional().default(0).describe('Offset for pagination'),
        },
        searchProductsHandler,
        false // Does not require authentication - product search is public
    );

    tool.registerTool(server);
}
