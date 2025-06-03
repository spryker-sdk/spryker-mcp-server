#!/usr/bin/env node

/**
 * Spryker MCP Server Launcher
 * 
 * This script starts the Spryker MCP Server with the appropriate configuration
 */

import { main } from '../dist/src/index.js';

// Start the server
main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
