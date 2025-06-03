/**
 * Structured logging utility for Spryker MCP Server
 *
 * Provides consistent, structured logging across the application with
 * proper log levels, formatting, and error handling.
 */
/**
 * Log levels in order of severity
 * Maps MCP logging levels to our internal levels
 */
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warning",// Map MCP 'warning' to our 'warn'
    INFO = "info",
    DEBUG = "debug"
}
/**
 * MCP Logging levels (as defined in the MCP SDK)
 */
export declare enum MCPLogLevel {
    DEBUG = "debug",
    INFO = "info",
    NOTICE = "notice",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical",
    ALERT = "alert",
    EMERGENCY = "emergency"
}
/**
 * Logger class with structured logging capabilities
 */
declare class Logger {
    private readonly component;
    private minLevel;
    constructor(component?: string, minLevel?: LogLevel);
    /**
     * Set the minimum log level (for MCP setLevel support)
     */
    setLevel(level: string): void;
    /**
     * Get the current minimum log level
     */
    getLevel(): LogLevel;
    /**
     * Check if a log level should be output
     */
    private shouldLog;
    /**
     * Format a log entry for output
     */
    private formatLogEntry;
    /**
     * Create a log entry
     */
    private createLogEntry;
    /**
     * Output a log entry to the appropriate stream
     * In MCP servers, all logging must go to stderr to avoid interfering with JSON-RPC protocol on stdout
     */
    private output;
    /**
     * Generic log method
     */
    private log;
    /**
     * Log an error message
     */
    error(message: string, error?: Error): void;
    error(message: string, metadata: Record<string, unknown>, error?: Error): void;
    /**
     * Log a warning message
     */
    warn(message: string, metadata?: Record<string, unknown>): void;
    /**
     * Log an info message
     */
    info(message: string, metadata?: Record<string, unknown>): void;
    /**
     * Log a debug message
     */
    debug(message: string, metadata?: Record<string, unknown>): void;
    /**
     * Create a child logger with a specific component name
     */
    child(component: string): Logger;
    /**
     * Create a global method to set level on all loggers
     */
    static setGlobalLevel(level: string): void;
}
/**
 * Default logger instance
 */
export declare const logger: Logger;
/**
 * Create a logger for a specific component
 */
export declare function createLogger(component: string): Logger;
/**
 * Export the Logger class for testing and advanced usage
 */
export { Logger };
//# sourceMappingURL=logger.d.ts.map