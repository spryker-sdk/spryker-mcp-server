/**
 * Structured logging utility for Spryker MCP Server
 * 
 * Provides consistent, structured logging across the application with
 * proper log levels, formatting, and error handling.
 */

import { config } from '../config/index.js';

/**
 * Log levels in order of severity
 * Maps MCP logging levels to our internal levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warning', // Map MCP 'warning' to our 'warn'
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * MCP Logging levels (as defined in the MCP SDK)
 */
export enum MCPLogLevel {
  DEBUG = 'debug',
  INFO = 'info', 
  NOTICE = 'notice',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
  ALERT = 'alert',
  EMERGENCY = 'emergency',
}

/**
 * Mapping from MCP levels to our internal levels
 */
const MCP_TO_INTERNAL_LEVEL: Record<string, LogLevel> = {
  'debug': LogLevel.DEBUG,
  'info': LogLevel.INFO,
  'notice': LogLevel.INFO,
  'warning': LogLevel.WARN,
  'error': LogLevel.ERROR,
  'critical': LogLevel.ERROR,
  'alert': LogLevel.ERROR,
  'emergency': LogLevel.ERROR,
};

/**
 * Log level priorities for filtering
 */
const LOG_PRIORITIES: Record<LogLevel, number> = {
  [LogLevel.ERROR]: 0,
  [LogLevel.WARN]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.DEBUG]: 3,
};

/**
 * Interface for structured log entries
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  component?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger class with structured logging capabilities
 */
class Logger {
  private readonly component: string;
  private minLevel: LogLevel; // Make this mutable for runtime changes

  constructor(component = 'SprykerMCP', minLevel: LogLevel = config.server.logLevel as LogLevel) {
    this.component = component;
    this.minLevel = minLevel;
  }

  /**
   * Set the minimum log level (for MCP setLevel support)
   */
  setLevel(level: string): void {
    const mappedLevel = MCP_TO_INTERNAL_LEVEL[level];
    if (mappedLevel) {
      this.minLevel = mappedLevel;
      this.info(`Log level changed to: ${level} (internal: ${mappedLevel})`);
    } else {
      this.warn(`Unknown log level: ${level}, keeping current level: ${this.minLevel}`);
    }
  }

  /**
   * Get the current minimum log level
   */
  getLevel(): LogLevel {
    return this.minLevel;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_PRIORITIES[level] <= LOG_PRIORITIES[this.minLevel];
  }

  /**
   * Format a log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, component, metadata, error } = entry;
    
    const baseLog = {
      timestamp,
      level,
      component,
      message,
    };

    const fullLog = {
      ...baseLog,
      ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {}),
      ...(error ? { error } : {}),
    };

    return JSON.stringify(fullLog);
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      component: this.component,
    };

    if (metadata) {
      entry.metadata = metadata;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
      };
      if (error.stack) {
        entry.error.stack = error.stack;
      }
    }

    return entry;
  }

  /**
   * Output a log entry to the appropriate stream
   * In MCP servers, all logging must go to stderr to avoid interfering with JSON-RPC protocol on stdout
   */
  private output(entry: LogEntry): void {
    const formatted = this.formatLogEntry(entry);
    
    // All logging goes to stderr in MCP servers to avoid protocol interference
    console.error(formatted);
  }

  /**
   * Generic log method
   */
  private log(
    level: LogLevel,
    message: string,
    metadataOrError?: Record<string, unknown> | Error,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    let metadata: Record<string, unknown> | undefined;
    let errorObj: Error | undefined;

    // Handle overloaded parameters
    if (metadataOrError instanceof Error) {
      errorObj = metadataOrError;
    } else if (metadataOrError) {
      metadata = metadataOrError;
      errorObj = error;
    }

    const entry = this.createLogEntry(level, message, metadata, errorObj);
    this.output(entry);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error): void;
  error(message: string, metadata: Record<string, unknown>, error?: Error): void;
  error(
    message: string,
    metadataOrError?: Record<string, unknown> | Error,
    error?: Error
  ): void {
    this.log(LogLevel.ERROR, message, metadataOrError, error);
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Create a child logger with a specific component name
   */
  child(component: string): Logger {
    return new Logger(`${this.component}:${component}`, this.minLevel);
  }

  /**
   * Create a global method to set level on all loggers
   */
  static setGlobalLevel(level: string): void {
    const mappedLevel = MCP_TO_INTERNAL_LEVEL[level];
    if (mappedLevel) {
      // Update the global logger instance
      logger.setLevel(level);
    }
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a logger for a specific component
 */
export function createLogger(component: string): Logger {
  return logger.child(component);
}

/**
 * Export the Logger class for testing and advanced usage
 */
export { Logger };
