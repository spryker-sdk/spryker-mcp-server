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
export var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warning";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (LogLevel = {}));
/**
 * MCP Logging levels (as defined in the MCP SDK)
 */
export var MCPLogLevel;
(function (MCPLogLevel) {
    MCPLogLevel["DEBUG"] = "debug";
    MCPLogLevel["INFO"] = "info";
    MCPLogLevel["NOTICE"] = "notice";
    MCPLogLevel["WARNING"] = "warning";
    MCPLogLevel["ERROR"] = "error";
    MCPLogLevel["CRITICAL"] = "critical";
    MCPLogLevel["ALERT"] = "alert";
    MCPLogLevel["EMERGENCY"] = "emergency";
})(MCPLogLevel || (MCPLogLevel = {}));
/**
 * Mapping from MCP levels to our internal levels
 */
const MCP_TO_INTERNAL_LEVEL = {
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
const LOG_PRIORITIES = {
    [LogLevel.ERROR]: 0,
    [LogLevel.WARN]: 1,
    [LogLevel.INFO]: 2,
    [LogLevel.DEBUG]: 3,
};
/**
 * Logger class with structured logging capabilities
 */
class Logger {
    component;
    minLevel; // Make this mutable for runtime changes
    constructor(component = 'SprykerMCP', minLevel = config.server.logLevel) {
        this.component = component;
        this.minLevel = minLevel;
    }
    /**
     * Set the minimum log level (for MCP setLevel support)
     */
    setLevel(level) {
        const mappedLevel = MCP_TO_INTERNAL_LEVEL[level];
        if (mappedLevel) {
            this.minLevel = mappedLevel;
            this.info(`Log level changed to: ${level} (internal: ${mappedLevel})`);
        }
        else {
            this.warn(`Unknown log level: ${level}, keeping current level: ${this.minLevel}`);
        }
    }
    /**
     * Get the current minimum log level
     */
    getLevel() {
        return this.minLevel;
    }
    /**
     * Check if a log level should be output
     */
    shouldLog(level) {
        return LOG_PRIORITIES[level] <= LOG_PRIORITIES[this.minLevel];
    }
    /**
     * Format a log entry for output
     */
    formatLogEntry(entry) {
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
    createLogEntry(level, message, metadata, error) {
        const entry = {
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
    output(entry) {
        const formatted = this.formatLogEntry(entry);
        // All logging goes to stderr in MCP servers to avoid protocol interference
        console.error(formatted);
    }
    /**
     * Generic log method
     */
    log(level, message, metadataOrError, error) {
        if (!this.shouldLog(level)) {
            return;
        }
        let metadata;
        let errorObj;
        // Handle overloaded parameters
        if (metadataOrError instanceof Error) {
            errorObj = metadataOrError;
        }
        else if (metadataOrError) {
            metadata = metadataOrError;
            errorObj = error;
        }
        const entry = this.createLogEntry(level, message, metadata, errorObj);
        this.output(entry);
    }
    error(message, metadataOrError, error) {
        this.log(LogLevel.ERROR, message, metadataOrError, error);
    }
    /**
     * Log a warning message
     */
    warn(message, metadata) {
        this.log(LogLevel.WARN, message, metadata);
    }
    /**
     * Log an info message
     */
    info(message, metadata) {
        this.log(LogLevel.INFO, message, metadata);
    }
    /**
     * Log a debug message
     */
    debug(message, metadata) {
        this.log(LogLevel.DEBUG, message, metadata);
    }
    /**
     * Create a child logger with a specific component name
     */
    child(component) {
        return new Logger(`${this.component}:${component}`, this.minLevel);
    }
    /**
     * Create a global method to set level on all loggers
     */
    static setGlobalLevel(level) {
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
export function createLogger(component) {
    return logger.child(component);
}
/**
 * Export the Logger class for testing and advanced usage
 */
export { Logger };
//# sourceMappingURL=logger.js.map