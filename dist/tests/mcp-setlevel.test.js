/**
 * MCP SetLevel Integration Tests
 *
 * Tests for the MCP logging/setLevel functionality
 */
import { logger, LogLevel } from '../src/utils/logger.js';
describe('MCP SetLevel Integration', () => {
    let originalLevel;
    beforeEach(() => {
        originalLevel = logger.getLevel();
    });
    afterEach(() => {
        // Restore original level
        logger.setLevel(originalLevel);
    });
    test('should change log level through logger.setLevel', () => {
        logger.setLevel('debug');
        expect(logger.getLevel()).toBe(LogLevel.DEBUG);
        logger.setLevel('warning');
        expect(logger.getLevel()).toBe(LogLevel.WARN);
        logger.setLevel('error');
        expect(logger.getLevel()).toBe(LogLevel.ERROR);
    });
    test('should handle MCP extended levels', () => {
        logger.setLevel('notice');
        expect(logger.getLevel()).toBe(LogLevel.INFO);
        logger.setLevel('critical');
        expect(logger.getLevel()).toBe(LogLevel.ERROR);
        logger.setLevel('alert');
        expect(logger.getLevel()).toBe(LogLevel.ERROR);
        logger.setLevel('emergency');
        expect(logger.getLevel()).toBe(LogLevel.ERROR);
    });
    test('should handle invalid levels gracefully', () => {
        const beforeLevel = logger.getLevel();
        logger.setLevel('invalid-level');
        expect(logger.getLevel()).toBe(beforeLevel);
    });
    test('should support all MCP logging levels', () => {
        const mcpLevels = ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'];
        mcpLevels.forEach(level => {
            expect(() => logger.setLevel(level)).not.toThrow();
            expect(typeof logger.getLevel()).toBe('string');
        });
    });
    test('should maintain level changes across operations', () => {
        logger.setLevel('debug');
        expect(logger.getLevel()).toBe(LogLevel.DEBUG);
        // Perform some logging operations
        logger.debug('Test debug message');
        logger.info('Test info message');
        // Level should remain unchanged
        expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    });
});
//# sourceMappingURL=mcp-setlevel.test.js.map