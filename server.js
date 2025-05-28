// server.js
import express from 'express';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

const server = new McpServer({
    name: 'Spryker MCP Server',
    version: '1.0.0'
});

// Dynamically load all tools from the tools directory
const toolsDir = path.join(__dirname, 'tools');
const toolFiles = fs.readdirSync(toolsDir).filter(file => file.endsWith('.js'));

for (const file of toolFiles) {
    const {default: registerTool} = await import(`./tools/${file}`);
    registerTool(server);
    console.log(`Loaded tool: ${file}`);
}

// Set up the HTTP transport
const transport = new StreamableHTTPServerTransport({path: '/mcp'});
server.connect(transport);

// Mount the transport's router to the Express app
app.use('/mcp', transport.router);

// Start the Express server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`MCP server is running at http://localhost:${PORT}/mcp`);
});
