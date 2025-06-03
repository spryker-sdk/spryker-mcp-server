/**
 * Prompt Registry Tests
 */
import { promptRegistry } from '../src/prompts/index.js';
describe('PromptRegistry', () => {
    test('should have prompts registered', () => {
        const prompts = promptRegistry.list();
        expect(prompts.length).toBeGreaterThan(0);
    });
    test('should have product-search prompt', () => {
        const prompt = promptRegistry.get('product-search');
        expect(prompt).toBeDefined();
        expect(prompt?.name).toBe('product-search');
        expect(prompt?.description).toContain('Search for products');
    });
    test('should have cart-management prompt', () => {
        const prompt = promptRegistry.get('cart-management');
        expect(prompt).toBeDefined();
        expect(prompt?.name).toBe('cart-management');
        expect(prompt?.description).toContain('shopping cart');
    });
    test('should have customer-service prompt', () => {
        const prompt = promptRegistry.get('customer-service');
        expect(prompt).toBeDefined();
        expect(prompt?.name).toBe('customer-service');
        expect(prompt?.description).toContain('customer service');
    });
    test('should have order-fulfillment prompt', () => {
        const prompt = promptRegistry.get('order-fulfillment');
        expect(prompt).toBeDefined();
        expect(prompt?.name).toBe('order-fulfillment');
        expect(prompt?.description).toContain('order process');
    });
    test('should return MCP formatted prompts', () => {
        const mcpPrompts = promptRegistry.getMCPPrompts();
        expect(mcpPrompts.length).toBe(5);
        const productPrompt = mcpPrompts.find(p => p.name === 'product-search');
        expect(productPrompt).toBeDefined();
        expect(productPrompt?.arguments).toBeDefined();
    });
    test('should generate prompt content with template substitution', () => {
        const content = promptRegistry.generatePromptContent('product-search', {
            query: 'laptops',
            category: 'electronics',
            price_range: '500-1000'
        });
        expect(content).toContain('laptops');
        expect(content).toContain('electronics');
        expect(content).toContain('500-1000');
        expect(content).not.toContain('{{');
    });
    test('should handle missing template variables', () => {
        const content = promptRegistry.generatePromptContent('product-search', {
            query: 'smartphones'
        });
        expect(content).toContain('smartphones');
        expect(content).not.toContain('{{');
    });
    test('should throw error for non-existent prompt', () => {
        expect(() => {
            promptRegistry.generatePromptContent('non-existent', {});
        }).toThrow('Prompt not found: non-existent');
    });
});
//# sourceMappingURL=prompt-registry.test.js.map