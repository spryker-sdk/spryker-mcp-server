/**
 * Tests for B2B shopping list tools
 */
import { getShoppingListsTool, createShoppingListTool, addToShoppingListTool, shoppingListToCartTool, } from '../../src/tools/b2b-shopping-lists';
import { SprykerApiService } from '../../src/services/spryker-api';
import { logger } from '../../src/utils/logger';
jest.mock('../../src/utils/logger');
jest.mock('../../src/services/spryker-api', () => {
    const originalModule = jest.requireActual('../../src/services/spryker-api');
    return {
        ...originalModule,
        SprykerApiService: { getInstance: jest.fn() },
    };
});
const { ApiError } = jest.requireActual('../../src/services/spryker-api');
const mockApiService = { get: jest.fn(), post: jest.fn() };
const mockLogger = logger;
beforeEach(() => {
    jest.clearAllMocks();
    SprykerApiService.getInstance.mockReturnValue(mockApiService);
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();
});
describe('shopping list tools availability', () => {
    it('are tagged for the b2b model only', () => {
        for (const tool of [getShoppingListsTool, createShoppingListTool, addToShoppingListTool, shoppingListToCartTool]) {
            expect(tool.availability).toEqual({ models: ['b2b'] });
        }
    });
});
describe('getShoppingListsTool', () => {
    it('lists shopping lists', async () => {
        mockApiService.get.mockResolvedValue({ status: 200, data: { data: [{ type: 'shopping-lists', id: 'sl-1', attributes: { name: 'Office' } }] } });
        const result = await getShoppingListsTool.handler({ token: 'auth' });
        expect(mockApiService.get).toHaveBeenCalledWith('shopping-lists', 'auth');
        const r = JSON.parse(result.content[0].text);
        expect(r.shoppingLists).toHaveLength(1);
        expect(r.items).toHaveLength(0);
    });
    it('gets a single list with items', async () => {
        mockApiService.get.mockResolvedValue({
            status: 200,
            data: {
                data: { type: 'shopping-lists', id: 'sl-1', attributes: {} },
                included: [{ type: 'shopping-list-items', id: 'i-1', attributes: { sku: 'SKU-1' } }],
            },
        });
        const result = await getShoppingListsTool.handler({ token: 'auth', shoppingListUuid: 'sl-uuid' });
        expect(mockApiService.get).toHaveBeenCalledWith('shopping-lists/sl-uuid?include=shopping-list-items', 'auth');
        expect(JSON.parse(result.content[0].text).items).toHaveLength(1);
    });
    it('handles null data and ApiError', async () => {
        mockApiService.get.mockResolvedValueOnce({ status: 200, data: { data: null } });
        let result = await getShoppingListsTool.handler({ token: 'auth' });
        expect(JSON.parse(result.content[0].text).shoppingLists).toHaveLength(0);
        mockApiService.get.mockRejectedValueOnce(new ApiError('x', 401, 'Unauthorized', ['no']));
        result = await getShoppingListsTool.handler({ token: 'auth' });
        expect('isError' in result && result.isError).toBe(true);
    });
    it('validates input', async () => {
        await expect(getShoppingListsTool.handler({})).rejects.toThrow();
    });
});
describe('createShoppingListTool', () => {
    it('creates a shopping list', async () => {
        mockApiService.post.mockResolvedValue({ status: 201, data: { data: { id: 'sl-1' } } });
        const result = await createShoppingListTool.handler({ token: 'auth', name: 'Office' });
        expect(mockApiService.post).toHaveBeenCalledWith('shopping-lists', { data: { type: 'shopping-lists', attributes: { name: 'Office' } } }, 'auth');
        expect(JSON.parse(result.content[0].text).success).toBe(true);
    });
    it('handles non-Error rejection', async () => {
        mockApiService.post.mockRejectedValue('boom');
        const result = await createShoppingListTool.handler({ token: 'auth', name: 'X' });
        expect(JSON.parse(result.content[0].text).message).toBe('Unknown error occurred');
    });
    it('validates input', async () => {
        await expect(createShoppingListTool.handler({ token: 'auth' })).rejects.toThrow();
    });
});
describe('addToShoppingListTool', () => {
    it('adds an item', async () => {
        mockApiService.post.mockResolvedValue({ status: 201, data: { data: { id: 'i-1' } } });
        const result = await addToShoppingListTool.handler({ token: 'auth', shoppingListUuid: 'sl-uuid', sku: 'SKU-1', quantity: 2 });
        expect(mockApiService.post).toHaveBeenCalledWith('shopping-lists/sl-uuid/shopping-list-items', { data: { type: 'shopping-list-items', attributes: { sku: 'SKU-1', quantity: 2 } } }, 'auth');
        expect(JSON.parse(result.content[0].text).success).toBe(true);
    });
    it('handles ApiError', async () => {
        mockApiService.post.mockRejectedValue(new ApiError('x', 404, 'Not Found', ['missing']));
        const result = await addToShoppingListTool.handler({ token: 'auth', shoppingListUuid: 'sl-uuid', sku: 'SKU-1' });
        expect(JSON.parse(result.content[0].text).responseData).toEqual(['missing']);
    });
    it('validates input', async () => {
        await expect(addToShoppingListTool.handler({ token: 'auth', shoppingListUuid: 'sl-uuid' })).rejects.toThrow();
    });
});
describe('shoppingListToCartTool', () => {
    it('moves all items into the cart', async () => {
        mockApiService.get.mockResolvedValue({
            status: 200,
            data: {
                included: [
                    { type: 'shopping-list-items', id: 'i-1', attributes: { sku: 'SKU-1', quantity: 3 } },
                    { type: 'shopping-list-items', id: 'i-2', attributes: { sku: 'SKU-2' } },
                    { type: 'other', id: 'x', attributes: {} },
                ],
            },
        });
        mockApiService.post.mockResolvedValue({ status: 201, data: {} });
        const result = await shoppingListToCartTool.handler({ token: 'auth', shoppingListUuid: 'sl-uuid', cartId: 'c1' });
        expect(mockApiService.post).toHaveBeenCalledTimes(2);
        expect(mockApiService.post).toHaveBeenCalledWith('carts/c1/items', { data: { type: 'items', attributes: { sku: 'SKU-1', quantity: 3 } } }, 'auth');
        const r = JSON.parse(result.content[0].text);
        expect(r.success).toBe(true);
        expect(r.added).toEqual(['SKU-1', 'SKU-2']);
    });
    it('reports partial failures', async () => {
        mockApiService.get.mockResolvedValue({ status: 200, data: { included: [{ type: 'shopping-list-items', id: 'i-1', attributes: { sku: 'SKU-1' } }] } });
        mockApiService.post.mockRejectedValue(new Error('out of stock'));
        const result = await shoppingListToCartTool.handler({ token: 'auth', shoppingListUuid: 'sl-uuid', cartId: 'c1' });
        expect('isError' in result && result.isError).toBe(true);
        expect(JSON.parse(result.content[0].text).failed).toHaveLength(1);
    });
    it('handles empty list and fetch failure', async () => {
        mockApiService.get.mockResolvedValueOnce({ status: 200, data: {} });
        let result = await shoppingListToCartTool.handler({ token: 'auth', shoppingListUuid: 'sl-uuid', cartId: 'c1' });
        expect(JSON.parse(result.content[0].text).added).toHaveLength(0);
        mockApiService.get.mockRejectedValueOnce(new ApiError('x', 500, 'Server Error', ['oops']));
        result = await shoppingListToCartTool.handler({ token: 'auth', shoppingListUuid: 'sl-uuid', cartId: 'c1' });
        expect('isError' in result && result.isError).toBe(true);
    });
    it('validates input', async () => {
        await expect(shoppingListToCartTool.handler({ token: 'auth', shoppingListUuid: 'sl-uuid' })).rejects.toThrow();
    });
});
//# sourceMappingURL=b2b-shopping-lists.test.js.map