/**
 * Tests for catalog navigation tools: get-category-tree, get-category, search-suggestions
 */

import { getCategoryTreeTool } from '../../src/tools/get-category-tree';
import { getCategoryTool } from '../../src/tools/get-category';
import { searchSuggestionsTool } from '../../src/tools/search-suggestions';
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

const mockApiService = { get: jest.fn() };
const mockLogger = logger as any;

beforeEach(() => {
  jest.clearAllMocks();
  (SprykerApiService.getInstance as jest.Mock).mockReturnValue(mockApiService);
  mockLogger.info = jest.fn();
  mockLogger.error = jest.fn();
});

describe('getCategoryTreeTool', () => {
  it('should have correct name', () => {
    expect(getCategoryTreeTool.name).toBe('get-category-tree');
  });

  it('should retrieve the category tree', async () => {
    mockApiService.get.mockResolvedValue({
      status: 200,
      data: { data: [{ type: 'category-trees', id: '1', attributes: { nodeId: 1, name: 'Root' } }] },
    });

    const result = await getCategoryTreeTool.handler({});

    expect(mockApiService.get).toHaveBeenCalledWith('category-trees');
    const response = JSON.parse(result.content[0]!.text);
    expect(response.success).toBe(true);
    expect(response.categories).toHaveLength(1);
  });

  it('should wrap a single object response', async () => {
    mockApiService.get.mockResolvedValue({
      status: 200,
      data: { data: { type: 'category-trees', id: '1', attributes: {} } },
    });
    const result = await getCategoryTreeTool.handler({});
    expect(JSON.parse(result.content[0]!.text).categories).toHaveLength(1);
  });

  it('should handle null/empty data', async () => {
    mockApiService.get.mockResolvedValue({ status: 200, data: { data: null } });
    const result = await getCategoryTreeTool.handler({});
    expect(JSON.parse(result.content[0]!.text).categories).toHaveLength(0);
  });

  it('should handle errors', async () => {
    mockApiService.get.mockRejectedValue(new ApiError('boom', 500, 'Server Error', { e: 1 }));
    const result = await getCategoryTreeTool.handler({});
    expect('isError' in result && result.isError).toBe(true);
    expect(JSON.parse(result.content[0]!.text).responseData).toEqual({ e: 1 });
  });
});

describe('getCategoryTool', () => {
  it('should have correct name and schema', () => {
    expect(getCategoryTool.name).toBe('get-category');
    expect(getCategoryTool.inputSchema.properties.categoryNodeId).toBeDefined();
  });

  it('should retrieve a category node', async () => {
    mockApiService.get.mockResolvedValue({
      status: 200,
      data: { data: { type: 'category-nodes', id: '5', attributes: { name: 'Cameras' } } },
    });

    const result = await getCategoryTool.handler({ categoryNodeId: '5' });

    expect(mockApiService.get).toHaveBeenCalledWith('category-nodes/5');
    const response = JSON.parse(result.content[0]!.text);
    expect(response.success).toBe(true);
    expect(response.category.id).toBe('5');
  });

  it('should handle errors', async () => {
    mockApiService.get.mockRejectedValue(new Error('Network error'));
    const result = await getCategoryTool.handler({ categoryNodeId: '5' });
    expect('isError' in result && result.isError).toBe(true);
    expect(JSON.parse(result.content[0]!.text).message).toBe('Network error');
  });

  it('should handle ApiError with response data', async () => {
    mockApiService.get.mockRejectedValue(new ApiError('x', 404, 'Not Found', ['err']));
    const result = await getCategoryTool.handler({ categoryNodeId: '5' });
    expect(JSON.parse(result.content[0]!.text).responseData).toEqual(['err']);
  });

  it('should validate input', async () => {
    await expect(getCategoryTool.handler({})).rejects.toThrow();
  });
});

describe('searchSuggestionsTool', () => {
  it('should have correct name and schema', () => {
    expect(searchSuggestionsTool.name).toBe('search-suggestions');
    expect(searchSuggestionsTool.inputSchema.properties.q).toBeDefined();
  });

  it('should retrieve suggestions', async () => {
    mockApiService.get.mockResolvedValue({
      status: 200,
      data: { data: [{ type: 'catalog-search-suggestions', id: null, attributes: { completion: ['camera'] } }] },
    });

    const result = await searchSuggestionsTool.handler({ q: 'cam' });

    expect(mockApiService.get).toHaveBeenCalledWith('catalog-search-suggestions?q=cam');
    const response = JSON.parse(result.content[0]!.text);
    expect(response.success).toBe(true);
    expect(response.suggestions).toHaveLength(1);
  });

  it('should wrap a single suggestion object and handle null data', async () => {
    mockApiService.get.mockResolvedValueOnce({
      status: 200,
      data: { data: { type: 'catalog-search-suggestions', id: null, attributes: {} } },
    });
    let result = await searchSuggestionsTool.handler({ q: 'a' });
    expect(JSON.parse(result.content[0]!.text).suggestions).toHaveLength(1);

    mockApiService.get.mockResolvedValueOnce({ status: 200, data: { data: null } });
    result = await searchSuggestionsTool.handler({ q: 'a' });
    expect(JSON.parse(result.content[0]!.text).suggestions).toHaveLength(0);
  });

  it('should handle ApiError with response data', async () => {
    mockApiService.get.mockRejectedValue(new ApiError('x', 400, 'Bad Request', ['err']));
    const result = await searchSuggestionsTool.handler({ q: 'cam' });
    expect(JSON.parse(result.content[0]!.text).responseData).toEqual(['err']);
  });

  it('should handle non-Error rejection', async () => {
    mockApiService.get.mockRejectedValue('string error');
    const result = await searchSuggestionsTool.handler({ q: 'cam' });
    expect('isError' in result && result.isError).toBe(true);
    expect(JSON.parse(result.content[0]!.text).message).toBe('Unknown error occurred');
  });

  it('should validate input', async () => {
    await expect(searchSuggestionsTool.handler({})).rejects.toThrow();
  });
});
