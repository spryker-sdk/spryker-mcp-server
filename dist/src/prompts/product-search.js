/**
 * Product Search Prompt
 *
 * Helps users search for products in the Spryker catalog with natural language queries
 */
export const productSearchPrompt = {
    name: 'product-search',
    description: 'Search for products in the Spryker catalog using natural language queries',
    arguments: [
        {
            name: 'query',
            description: 'Product search query (e.g., "smartphones under 200 euros", "Samsung cameras", "laptops with 16GB RAM")',
            required: false
        },
        {
            name: 'category',
            description: 'Specific product category to search in (optional)',
            required: false
        },
        {
            name: 'price_range',
            description: 'Price range in format "min-max" (e.g., "100-500")',
            required: false
        },
        {
            name: 'brand',
            description: 'Specific brand to filter by (optional)',
            required: false
        }
    ],
    template: `You are a helpful e-commerce assistant for a Spryker-powered online store. Help the user find products based on their requirements.

{{#if query}}
User is looking for: {{query}}
{{/if}}

{{#if category}}
Focus on category: {{category}}
{{/if}}

{{#if price_range}}
Price range: {{price_range}} EUR
{{/if}}

{{#if brand}}
Preferred brand: {{brand}}
{{/if}}

Instructions:
1. Use the f1e_product_search tool to search for products matching the criteria
2. Apply appropriate filters (valueFacets for brand/category, rangeFacets for price)
3. Present results in a user-friendly format with:
   - Product name and SKU
   - Price in EUR
   - Key features/attributes
   - Availability status
4. If no exact matches, suggest similar products or alternative criteria
5. Offer to help add products to cart or get more details

Always be helpful and provide clear product recommendations with reasoning.`
};
//# sourceMappingURL=product-search.js.map