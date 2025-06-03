/**
 * Tests for Validation Utilities
 */

// Mock config with all required properties
const mockConfig = {
  server: {
    logLevel: 'info'
  },
  api: {
    baseUrl: 'https://test-api.example.com',
    timeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  rateLimit: {
    windowMs: 60000,
    maxRequests: 100
  }
};

// Mock the config before any other imports
jest.mock('../../src/config/index.js', () => ({
  config: mockConfig
}));

// Mock the logger to prevent config dependency issues
jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

import { 
  validateEnvironment,
  validateToolArguments,
  ValidationError
} from '../../src/utils/validation.js';
import { z } from 'zod';

// Additional validation function for testing config branches
// We'll need to test the validateServerConfig function indirectly through validateEnvironment

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Validation Utilities', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('ValidationError', () => {
    it('should create proper error objects', () => {
      const error = new ValidationError('Test error', 'TEST_CODE');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('validateEnvironment', () => {
    it('should pass with valid environment', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200
      });

      await expect(validateEnvironment()).resolves.not.toThrow();
    });

    it('should handle API connectivity issues gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw - API connectivity is a warning, not an error
      await expect(validateEnvironment()).resolves.not.toThrow();
    });

    it('should validate Node.js version', async () => {
      // Mock process.version to simulate old Node.js
      const originalVersion = process.version;
      Object.defineProperty(process, 'version', {
        value: 'v16.0.0',
        configurable: true
      });

      mockFetch.mockResolvedValueOnce({
        status: 200
      });

      try {
        await expect(validateEnvironment()).rejects.toThrow(ValidationError);
      } finally {
        // Restore original version
        Object.defineProperty(process, 'version', {
          value: originalVersion,
          configurable: true
        });
      }
    });
  });

  describe('validateEnvironment - comprehensive tests', () => {
    // Since module mocking is complex, let's test individual validation scenarios 
    // by directly testing the functions or simulating conditions

    it('should handle fetch failures during API connectivity test', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      // Should not throw - API connectivity failure is handled gracefully
      await expect(validateEnvironment()).resolves.not.toThrow();
    });

    it('should handle fetch timeout during API connectivity test', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      await expect(validateEnvironment()).resolves.not.toThrow();
    });

    it('should handle non-200 responses during API connectivity test', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 404,
        statusText: 'Not Found'
      });

      await expect(validateEnvironment()).resolves.not.toThrow();
    });

    it('should handle server error responses during API connectivity test', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(validateEnvironment()).resolves.not.toThrow();
    });

    it('should handle fetch rejecting with non-Error objects', async () => {
      mockFetch.mockRejectedValueOnce('String error instead of Error object');

      await expect(validateEnvironment()).resolves.not.toThrow();
    });

    it('should fail with invalid API timeout configuration', async () => {
      const originalConfig = { ...mockConfig };
      mockConfig.api.timeout = 0;

      try {
        await expect(validateEnvironment()).rejects.toThrow(ValidationError);
      } finally {
        mockConfig.api.timeout = originalConfig.api.timeout;
      }
    });

    it('should fail with negative retry attempts configuration', async () => {
      const originalConfig = { ...mockConfig };
      mockConfig.api.retryAttempts = -1;

      try {
        await expect(validateEnvironment()).rejects.toThrow(ValidationError);
      } finally {
        mockConfig.api.retryAttempts = originalConfig.api.retryAttempts;
      }
    });

    it('should fail with invalid retry delay configuration', async () => {
      const originalConfig = { ...mockConfig };
      mockConfig.api.retryDelay = 0;

      try {
        await expect(validateEnvironment()).rejects.toThrow(ValidationError);
      } finally {
        mockConfig.api.retryDelay = originalConfig.api.retryDelay;
      }
    });

    it('should fail with invalid rate limit window configuration', async () => {
      const originalConfig = { ...mockConfig };
      mockConfig.rateLimit.windowMs = 0;

      try {
        await expect(validateEnvironment()).rejects.toThrow(ValidationError);
      } finally {
        mockConfig.rateLimit.windowMs = originalConfig.rateLimit.windowMs;
      }
    });

    it('should fail with invalid rate limit max requests configuration', async () => {
      const originalConfig = { ...mockConfig };
      mockConfig.rateLimit.maxRequests = 0;

      try {
        await expect(validateEnvironment()).rejects.toThrow(ValidationError);
      } finally {
        mockConfig.rateLimit.maxRequests = originalConfig.rateLimit.maxRequests;
      }
    });

    it('should fail with missing base URL configuration', async () => {
      const originalConfig = { ...mockConfig };
      mockConfig.api.baseUrl = '';

      try {
        await expect(validateEnvironment()).rejects.toThrow(ValidationError);
      } finally {
        mockConfig.api.baseUrl = originalConfig.api.baseUrl;
      }
    });

    it('should handle unexpected errors during validation', async () => {
      const originalConfig = { ...mockConfig };
      // Create an invalid object to trigger unexpected error
      Object.defineProperty(mockConfig, 'api', {
        get() {
          throw new Error('Unexpected error accessing config');
        },
        configurable: true
      });

      try {
        await expect(validateEnvironment()).rejects.toThrow(ValidationError);
      } finally {
        // Restore config
        Object.defineProperty(mockConfig, 'api', {
          value: originalConfig.api,
          configurable: true,
          writable: true
        });
      }
    });
  });

  describe('validateToolArguments', () => {
    const testSchema = z.object({
      name: z.string(),
      age: z.number().min(0)
    });

    it('should validate correct arguments', () => {
      const validArgs = { name: 'John', age: 30 };
      
      const result = validateToolArguments(validArgs, testSchema, 'testTool');
      
      expect(result).toEqual(validArgs);
    });

    it('should reject invalid arguments', () => {
      const invalidArgs = { name: 'John', age: -5 };
      
      expect(() => {
        validateToolArguments(invalidArgs, testSchema, 'testTool');
      }).toThrow(ValidationError);
    });

    it('should reject missing required fields', () => {
      const invalidArgs = { name: 'John' }; // missing age
      
      expect(() => {
        validateToolArguments(invalidArgs, testSchema, 'testTool');
      }).toThrow(ValidationError);
    });

    it('should reject wrong types', () => {
      const invalidArgs = { name: 'John', age: 'thirty' };
      
      expect(() => {
        validateToolArguments(invalidArgs, testSchema, 'testTool');
      }).toThrow(ValidationError);
    });

    it('should include tool name in error message', () => {
      const invalidArgs = { name: 'John', age: -5 };
      
      try {
        validateToolArguments(invalidArgs, testSchema, 'myTestTool');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('myTestTool');
      }
    });

    it('should validate valid arguments', () => {
      const mockSchema = {
        parse: jest.fn().mockReturnValue({ valid: true })
      };
      
      const result = validateToolArguments({ test: 'data' }, mockSchema, 'test-tool');
      
      expect(result).toEqual({ valid: true });
      expect(mockSchema.parse).toHaveBeenCalledWith({ test: 'data' });
    });

    it('should handle schema validation errors', () => {
      const mockSchema = {
        parse: jest.fn().mockImplementation(() => {
          throw new Error('Schema validation failed');
        })
      };
      
      expect(() => validateToolArguments({ test: 'data' }, mockSchema, 'test-tool'))
        .toThrow('Invalid arguments for tool test-tool');
    });

    it('should handle non-Error schema validation failures', () => {
      const mockSchema = {
        parse: jest.fn().mockImplementation(() => {
          throw 'String error';
        })
      };
      
      expect(() => validateToolArguments({ test: 'data' }, mockSchema, 'test-tool'))
        .toThrow('Invalid arguments for tool test-tool: Unknown error');
    });
  });
});
