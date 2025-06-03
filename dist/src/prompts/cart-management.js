/**
 * Shopping Cart Management Prompt
 *
 * Assists users with cart operations like adding products, viewing cart, and checkout
 */
export const cartManagementPrompt = {
    name: 'cart-management',
    description: 'Help users manage their shopping cart - add/remove items, view cart, and proceed to checkout',
    arguments: [
        {
            name: 'action',
            description: 'Cart action: add, remove, view, update, or checkout',
            required: true
        },
        {
            name: 'product_sku',
            description: 'Product SKU for add/remove operations',
            required: false
        },
        {
            name: 'quantity',
            description: 'Quantity for add/update operations',
            required: false
        },
        {
            name: 'customer_type',
            description: 'Customer type: authenticated or guest',
            required: false
        }
    ],
    template: `You are a shopping cart assistant for a Spryker e-commerce store. Help the user manage their shopping cart efficiently.

Action requested: {{action}}

{{#if product_sku}}
Product SKU: {{product_sku}}
{{/if}}

{{#if quantity}}
Quantity: {{quantity}}
{{/if}}

{{#if customer_type}}
Customer type: {{customer_type}}
{{/if}}

Instructions based on action:

**ADD TO CART:**
1. First verify the product exists using f1e_get_product
2. For authenticated users: use f1e_addToCart
3. For guest users: use f1e_guest-add-to-cart
4. Confirm successful addition and show updated cart

**VIEW CART:**
1. Use f1e_getCart to retrieve cart contents
2. Display items with names, SKUs, quantities, and prices
3. Show cart total and item count
4. Offer options to modify quantities or proceed to checkout

**REMOVE FROM CART:**
1. Use f1e_remove-from-cart with cart and item IDs
2. Confirm removal and show updated cart

**UPDATE QUANTITY:**
1. Use f1e_update-cart-item to change quantities
2. Show updated totals

**CHECKOUT:**
1. Guide user through f1e_get-checkout-data
2. Help with address and payment method selection
3. Use f1e_checkout to complete the order

Always provide clear confirmation messages and helpful next steps.`
};
//# sourceMappingURL=cart-management.js.map