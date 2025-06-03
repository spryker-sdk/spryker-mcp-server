/**
 * Jest test setup file
 */

/* eslint-disable @typescript-eslint/no-var-requires */
// Ensure Jest globals are available for TypeScript
/// <reference types="jest" />

import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SPRYKER_API_BASE_URL = 'https://test-api.example.com';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise
global.console = {
  ...console,
  debug: jest.fn(),
  info: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
