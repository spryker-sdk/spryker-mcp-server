/**
 * Comprehensive Logger Tests
 *
 * Tests for all logger functionality including edge cases and branches
 */
// Mock config first
const mockConfig = {
    server: {
        logLevel: 'info'
    }
};
jest.mock('../../src/config/index.js', () => ({
    config: mockConfig
}));
import { Logger, LogLevel, createLogger, logger } from '../../src/utils/logger.js';
describe('Logger Comprehensive Tests', () => {
    let originalConsoleError;
    let consoleErrorSpy;
    beforeEach(() => {
        originalConsoleError = console.error;
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });
    afterEach(() => {
        consoleErrorSpy.mockRestore();
        console.error = originalConsoleError;
    });
    describe('Logger initialization', () => {
        it('should create logger with default component and level', () => {
            const defaultLogger = new Logger();
            expect(defaultLogger.getLevel()).toBe(LogLevel.INFO);
        });
        it('should create logger with custom component and level', () => {
            const customLogger = new Logger('CustomComponent', LogLevel.DEBUG);
            expect(customLogger.getLevel()).toBe(LogLevel.DEBUG);
        });
    });
    describe('Log level filtering', () => {
        let testLogger;
        beforeEach(() => {
            testLogger = new Logger('TestComponent', LogLevel.INFO);
        });
        it('should log messages at or above the minimum level', () => {
            testLogger.error('Error message');
            testLogger.warn('Warning message');
            testLogger.info('Info message');
            testLogger.debug('Debug message'); // Should not log
            expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
        });
        it('should respect debug level when set', () => {
            testLogger.setLevel('debug');
            // Clear any previous calls from setLevel
            consoleErrorSpy.mockClear();
            testLogger.error('Error message');
            testLogger.warn('Warning message');
            testLogger.info('Info message');
            testLogger.debug('Debug message');
            expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
        });
        it('should respect error level when set', () => {
            testLogger.setLevel('error');
            // Clear any previous calls from setLevel
            consoleErrorSpy.mockClear();
            testLogger.error('Error message');
            testLogger.warn('Warning message');
            testLogger.info('Info message');
            testLogger.debug('Debug message');
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        });
    });
    describe('Log entry formatting', () => {
        let testLogger;
        beforeEach(() => {
            testLogger = new Logger('TestComponent', LogLevel.DEBUG);
        });
        it('should format basic log entries', () => {
            testLogger.info('Test message');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('"message":"Test message"'));
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('"level":"info"'));
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('"component":"TestComponent"'));
        });
        it('should format log entries with metadata', () => {
            testLogger.info('Test message', { key: 'value', count: 42 });
            const logCall = consoleErrorSpy.mock.calls[0][0];
            const parsedLog = JSON.parse(logCall);
            expect(parsedLog.metadata).toEqual({ key: 'value', count: 42 });
        });
        it('should format log entries with errors', () => {
            const testError = new Error('Test error');
            testError.stack = 'Error stack trace';
            testLogger.error('Error occurred', testError);
            const logCall = consoleErrorSpy.mock.calls[0][0];
            const parsedLog = JSON.parse(logCall);
            expect(parsedLog.error).toEqual({
                name: 'Error',
                message: 'Test error',
                stack: 'Error stack trace'
            });
        });
        it('should format log entries with error but no stack', () => {
            const testError = new Error('Test error');
            delete testError.stack;
            testLogger.error('Error occurred', testError);
            const logCall = consoleErrorSpy.mock.calls[0][0];
            const parsedLog = JSON.parse(logCall);
            expect(parsedLog.error).toEqual({
                name: 'Error',
                message: 'Test error'
            });
            expect(parsedLog.error.stack).toBeUndefined();
        });
        it('should format log entries with metadata and error', () => {
            const testError = new Error('Test error');
            testLogger.error('Error occurred', { userId: 123 }, testError);
            const logCall = consoleErrorSpy.mock.calls[0][0];
            const parsedLog = JSON.parse(logCall);
            expect(parsedLog.metadata).toEqual({ userId: 123 });
            expect(parsedLog.error.message).toBe('Test error');
        });
        it('should not include metadata if empty', () => {
            testLogger.info('Test message', {});
            const logCall = consoleErrorSpy.mock.calls[0][0];
            const parsedLog = JSON.parse(logCall);
            expect(parsedLog.metadata).toBeUndefined();
        });
        it('should include timestamp in ISO format', () => {
            testLogger.info('Test message');
            const logCall = consoleErrorSpy.mock.calls[0][0];
            const parsedLog = JSON.parse(logCall);
            expect(parsedLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });
    });
    describe('Error method overloads', () => {
        let testLogger;
        beforeEach(() => {
            testLogger = new Logger('TestComponent', LogLevel.DEBUG);
        });
        it('should handle error(message, error) overload', () => {
            const testError = new Error('Test error');
            testLogger.error('Error occurred', testError);
            const logCall = consoleErrorSpy.mock.calls[0][0];
            const parsedLog = JSON.parse(logCall);
            expect(parsedLog.message).toBe('Error occurred');
            expect(parsedLog.error.message).toBe('Test error');
            expect(parsedLog.metadata).toBeUndefined();
        });
        it('should handle error(message, metadata, error) overload', () => {
            const testError = new Error('Test error');
            testLogger.error('Error occurred', { context: 'test' }, testError);
            const logCall = consoleErrorSpy.mock.calls[0][0];
            const parsedLog = JSON.parse(logCall);
            expect(parsedLog.message).toBe('Error occurred');
            expect(parsedLog.error.message).toBe('Test error');
            expect(parsedLog.metadata.context).toBe('test');
        });
        it('should handle error(message) with no additional parameters', () => {
            testLogger.error('Simple error');
            const logCall = consoleErrorSpy.mock.calls[0][0];
            const parsedLog = JSON.parse(logCall);
            expect(parsedLog.message).toBe('Simple error');
            expect(parsedLog.error).toBeUndefined();
            expect(parsedLog.metadata).toBeUndefined();
        });
    });
    describe('Child logger functionality', () => {
        let parentLogger;
        beforeEach(() => {
            parentLogger = new Logger('Parent', LogLevel.DEBUG);
        });
        it('should create child logger with nested component name', () => {
            const childLogger = parentLogger.child('Child');
            childLogger.info('Child message');
            const logCall = consoleErrorSpy.mock.calls[0][0];
            const parsedLog = JSON.parse(logCall);
            expect(parsedLog.component).toBe('Parent:Child');
        });
        it('should inherit parent log level', () => {
            parentLogger.setLevel('error');
            const childLogger = parentLogger.child('Child');
            expect(childLogger.getLevel()).toBe(LogLevel.ERROR);
        });
    });
    describe('Global logger functions', () => {
        it('should create logger with createLogger function', () => {
            const componentLogger = createLogger('ComponentName');
            componentLogger.info('Test message');
            const logCall = consoleErrorSpy.mock.calls[0][0];
            const parsedLog = JSON.parse(logCall);
            expect(parsedLog.component).toBe('SprykerMCP:ComponentName');
        });
        it('should set global level on default logger', () => {
            const originalLevel = logger.getLevel();
            Logger.setGlobalLevel('debug');
            expect(logger.getLevel()).toBe(LogLevel.DEBUG);
            // Restore original level
            Logger.setGlobalLevel(originalLevel);
        });
        it('should handle invalid global level gracefully', () => {
            const originalLevel = logger.getLevel();
            Logger.setGlobalLevel('invalid-level');
            expect(logger.getLevel()).toBe(originalLevel);
        });
    });
    describe('Edge cases and error handling', () => {
        let testLogger;
        beforeEach(() => {
            testLogger = new Logger('TestComponent', LogLevel.DEBUG);
        });
        it('should handle log calls when shouldLog returns false', () => {
            testLogger.setLevel('error');
            testLogger.debug('Debug message');
            testLogger.info('Info message');
            testLogger.warn('Warning message');
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
        it('should handle metadata with nested objects', () => {
            const complexMetadata = {
                user: { id: 123, name: 'John' },
                settings: { theme: 'dark', notifications: true },
                timestamp: new Date().toISOString()
            };
            testLogger.info('Complex metadata', complexMetadata);
            const logCall = consoleErrorSpy.mock.calls[0][0];
            const parsedLog = JSON.parse(logCall);
            expect(parsedLog.metadata).toEqual(complexMetadata);
        });
        it('should handle null and undefined metadata gracefully', () => {
            testLogger.info('Test message', undefined);
            testLogger.info('Test message', null);
            expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
            consoleErrorSpy.mock.calls.forEach(call => {
                const parsedLog = JSON.parse(call[0]);
                expect(parsedLog.metadata).toBeUndefined();
            });
        });
    });
});
//# sourceMappingURL=logger.test.js.map