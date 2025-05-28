// stdioServer.js
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create MCP server instance with the same configuration as HTTP server
const server = new McpServer({
        name: "example-servers/everything",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {}
        },
    }
);

// Use the same tool loading logic as the HTTP server
const toolsDir = path.join(__dirname, 'tools');
const toolFiles = fs.readdirSync(toolsDir).filter(file => file.endsWith('.js'));

async function startServer() {
    try {
        // Load all tools (same as HTTP server)
        for (const file of toolFiles) {
            const {default: registerTool} = await import(`./tools/${file}`);
            registerTool(server);
            console.log(`Loaded tool: ${file}`);
        }

        // Set up Stdio transport instead of HTTP transport
        const transport = new StdioServerTransport();
        server.connect(transport);

        console.log("Spryker MCP Stdio server is running. Waiting for input...");
    } catch (error) {
        console.error('Failed to start Stdio server:', error);
        process.exit(1);
    }
}

startServer();
