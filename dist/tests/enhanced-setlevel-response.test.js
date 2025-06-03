/**
 * Enhanced SetLevel Response Tests
 *
 * Tests for the detailed response format of the MCP logging/setLevel handler
 */
import { logger, LogLevel } from '../src/utils/logger.js';
describe('Enhanced SetLevel Response Format', () => {
    let originalLevel;
    beforeEach(() => {
        originalLevel = logger.getLevel();
    });
    afterEach(() => {
        // Restore original level
        logger.setLevel(originalLevel);
    });
    test('should simulate MCP setLevel handler response format', () => {
        // Simulate the MCP handler logic
        const requestedLevel = 'debug';
        const previousLevel = logger.getLevel();
        logger.setLevel(requestedLevel);
        const newLevel = logger.getLevel();
        // Create response object like the MCP handler does
        const response = {
            message: `Log level changed from '${previousLevel}' to '${newLevel}'`,
            previousLevel: previousLevel,
            newLevel: newLevel,
            requestedLevel: requestedLevel,
            timestamp: new Date().toISOString()
        };
        // Verify response structure
        expect(response).toHaveProperty('message');
        expect(response).toHaveProperty('previousLevel');
        expect(response).toHaveProperty('newLevel');
        expect(response).toHaveProperty('requestedLevel');
        expect(response).toHaveProperty('timestamp');
        // Verify response content
        expect(response.message).toContain('Log level changed');
        expect(response.message).toContain(previousLevel);
        expect(response.message).toContain(newLevel);
        expect(response.previousLevel).toBe(previousLevel);
        expect(response.newLevel).toBe(LogLevel.DEBUG);
        expect(response.requestedLevel).toBe(requestedLevel);
        expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
    test('should show no change when setting same level', () => {
        // Set to a specific level first
        logger.setLevel('info');
        const currentLevel = logger.getLevel();
        // Try to set to the same level
        const requestedLevel = 'info';
        const previousLevel = logger.getLevel();
        logger.setLevel(requestedLevel);
        const newLevel = logger.getLevel();
        const response = {
            message: `Log level changed from '${previousLevel}' to '${newLevel}'`,
            previousLevel: previousLevel,
            newLevel: newLevel,
            requestedLevel: requestedLevel,
            timestamp: new Date().toISOString()
        };
        // Both levels should be the same
        expect(response.previousLevel).toBe(response.newLevel);
        expect(response.newLevel).toBe(LogLevel.INFO);
        expect(response.message).toContain(`from '${LogLevel.INFO}' to '${LogLevel.INFO}'`);
    });
    test('should handle MCP extended levels in response', () => {
        const mcpExtendedLevels = [
            { mcp: 'notice', expected: LogLevel.INFO },
            { mcp: 'critical', expected: LogLevel.ERROR },
            { mcp: 'alert', expected: LogLevel.ERROR },
            { mcp: 'emergency', expected: LogLevel.ERROR }
        ];
        mcpExtendedLevels.forEach(({ mcp, expected }) => {
            const previousLevel = logger.getLevel();
            logger.setLevel(mcp);
            const newLevel = logger.getLevel();
            const response = {
                message: `Log level changed from '${previousLevel}' to '${newLevel}'`,
                previousLevel: previousLevel,
                newLevel: newLevel,
                requestedLevel: mcp,
                timestamp: new Date().toISOString()
            };
            expect(response.newLevel).toBe(expected);
            expect(response.requestedLevel).toBe(mcp);
            expect(response.message).toContain('Log level changed');
        });
    });
    test('should handle invalid level gracefully in response', () => {
        const previousLevel = logger.getLevel();
        const invalidLevel = 'invalid-level';
        logger.setLevel(invalidLevel);
        const newLevel = logger.getLevel();
        const response = {
            message: `Log level changed from '${previousLevel}' to '${newLevel}'`,
            previousLevel: previousLevel,
            newLevel: newLevel,
            requestedLevel: invalidLevel,
            timestamp: new Date().toISOString()
        };
        // Level should remain unchanged for invalid input
        expect(response.previousLevel).toBe(response.newLevel);
        expect(response.requestedLevel).toBe(invalidLevel);
        expect(response.message).toContain(`from '${previousLevel}' to '${newLevel}'`);
    });
    test('should include valid timestamp format', () => {
        const requestedLevel = 'warning';
        const previousLevel = logger.getLevel();
        logger.setLevel(requestedLevel);
        const newLevel = logger.getLevel();
        const beforeTimestamp = new Date();
        const response = {
            message: `Log level changed from '${previousLevel}' to '${newLevel}'`,
            previousLevel: previousLevel,
            newLevel: newLevel,
            requestedLevel: requestedLevel,
            timestamp: new Date().toISOString()
        };
        const afterTimestamp = new Date();
        // Verify timestamp is valid ISO string
        expect(() => new Date(response.timestamp)).not.toThrow();
        const responseTime = new Date(response.timestamp);
        expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeTimestamp.getTime());
        expect(responseTime.getTime()).toBeLessThanOrEqual(afterTimestamp.getTime());
    });
});
//# sourceMappingURL=enhanced-setlevel-response.test.js.map