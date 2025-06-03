/**
 * Environment and runtime validation utilities
 *
 * Provides validation functions to ensure the server environment
 * is properly configured and all required dependencies are available.
 */
/**
 * Validation error class for environment issues
 */
export declare class ValidationError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
/**
 * Validate all environment and configuration requirements
 */
export declare function validateEnvironment(): Promise<void>;
/**
 * Validate tool arguments against a schema
 */
export declare function validateToolArguments<T>(args: unknown, schema: {
    parse: (data: unknown) => T;
}, toolName: string): T;
//# sourceMappingURL=validation.d.ts.map