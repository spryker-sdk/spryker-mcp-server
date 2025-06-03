/**
 * Logger Level Tests
 *
 * Tests for dynamic log level changes and MCP setLevel functionality
 */
import { Logger, LogLevel, MCPLogLevel } from '../src/utils/logger.js';
describe('Logger Level Management', () => {
    let testLogger;
    beforeEach(() => {
        testLogger = new Logger('TestComponent', LogLevel.INFO);
    });
    test('should initialize with correct log level', () => {
        expect(testLogger.getLevel()).toBe(LogLevel.INFO);
    });
    test('should change log level using setLevel with MCP levels', () => {
        testLogger.setLevel('debug');
        expect(testLogger.getLevel()).toBe(LogLevel.DEBUG);
        testLogger.setLevel('warning');
        expect(testLogger.getLevel()).toBe(LogLevel.WARN);
        testLogger.setLevel('error');
        expect(testLogger.getLevel()).toBe(LogLevel.ERROR);
    });
    test('should handle extended MCP log levels', () => {
        testLogger.setLevel('notice');
        expect(testLogger.getLevel()).toBe(LogLevel.INFO);
        testLogger.setLevel('critical');
        expect(testLogger.getLevel()).toBe(LogLevel.ERROR);
        testLogger.setLevel('alert');
        expect(testLogger.getLevel()).toBe(LogLevel.ERROR);
        testLogger.setLevel('emergency');
        expect(testLogger.getLevel()).toBe(LogLevel.ERROR);
    });
    test('should handle invalid log levels gracefully', () => {
        const originalLevel = testLogger.getLevel();
        testLogger.setLevel('invalid-level');
        expect(testLogger.getLevel()).toBe(originalLevel);
    });
    test('should have all MCP log levels mapped', () => {
        const mcpLevels = Object.values(MCPLogLevel);
        mcpLevels.forEach(level => {
            const originalLevel = testLogger.getLevel();
            testLogger.setLevel(level);
            // Should not throw an error and should map to a valid internal level
            expect(typeof testLogger.getLevel()).toBe('string');
        });
    });
    test('should create child logger with current level', () => {
        testLogger.setLevel('debug');
        const childLogger = testLogger.child('ChildComponent');
        expect(childLogger.getLevel()).toBe(LogLevel.DEBUG);
    });
});
//# sourceMappingURL=logger-level.test.js.map