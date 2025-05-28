// utils/baseTool.js
import {z} from 'zod';
import {formatErrorResponse} from './responseFormatter.js';

export class BaseTool {
    constructor(name, description, schema, handler, requiresAuth = false) {
        this.name = name;
        this.description = description;
        // Add token to schema if authentication is required
        this.schema = requiresAuth
            ? {token: z.string().describe('Authentication token'), ...schema}
            : schema;
        this.originalHandler = handler;
        this.requiresAuth = requiresAuth;
    }

    registerTool(server) {
        server.tool(this.name, this.description, this.schema, async (params) => {
            if (this.requiresAuth) {
                const {token, ...otherParams} = params;
                if (!token) {
                    return formatErrorResponse(new Error('Authentication token is required'));
                }
                return this.originalHandler({token, ...otherParams});
            }
            return this.originalHandler(params);
        });
    }
}
