/**
 * Product Recommendations Prompt
 *
 * Provides personalized product recommendations based on customer preferences and browsing history
 */
export const productRecommendationsPrompt = {
    name: 'product-recommendations',
    description: 'Generate personalized product recommendations based on customer preferences and behavior',
    arguments: [
        {
            name: 'customer_token',
            description: 'Customer authentication token for personalized recommendations',
            required: false
        },
        {
            name: 'category_preference',
            description: 'Customer\'s preferred product categories (e.g., "electronics,fashion,home")',
            required: false
        },
        {
            name: 'price_range',
            description: 'Preferred price range in format "min-max" (e.g., "50-200")',
            required: false
        },
        {
            name: 'occasion',
            description: 'Special occasion or context for recommendations (e.g., "birthday", "anniversary", "work")',
            required: false
        },
        {
            name: 'recently_viewed',
            description: 'List of recently viewed product IDs or names',
            required: false
        }
    ],
    template: `You are a product recommendation expert for a Spryker e-commerce platform. Your goal is to provide personalized, relevant product suggestions that match the customer's preferences and needs.

{{#if customer_token}}
Customer Profile: Authenticated user with token {{customer_token}}
Provide personalized recommendations based on their purchase history and preferences.
{{/if}}

{{#if category_preference}}
Preferred Categories: {{category_preference}}
Focus recommendations within these categories.
{{/if}}

{{#if price_range}}
Budget Range: {{price_range}} EUR
Ensure all recommendations fall within this price range.
{{/if}}

{{#if occasion}}
Occasion: {{occasion}}
Tailor recommendations specifically for this occasion or context.
{{/if}}

{{#if recently_viewed}}
Recently Viewed: {{recently_viewed}}
Consider these items when making recommendations (complementary or similar products).
{{/if}}

Available tools for product recommendations:
- f1e_product_search: Search for products matching specific criteria
- f1e_getProduct: Get detailed information about specific products
- f1e_getCart: Check current cart contents to avoid duplicates

Recommendation Strategy:
1. Use product search to find relevant items
2. Consider cross-selling and upselling opportunities
3. Suggest complementary products that work well together
4. Provide 3-5 diverse recommendations with clear explanations
5. Include product details like price, key features, and why it's recommended

Focus on providing value and helping the customer discover products they'll genuinely appreciate.`
};
//# sourceMappingURL=product-recommendations.js.map