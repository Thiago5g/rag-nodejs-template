#!/usr/bin/env node

import { MCPServer } from './server/mcp-server.js';
import { helloTool } from './tools/hello.tool.js';
import { httpTool } from './tools/http.tool.js';

/**
 * MCP Server Entry Point
 *
 * Register your tools, resources, and prompts here.
 * Then start the server with your preferred transport.
 */
const server = new MCPServer({
  name: 'mcp-server-base',
  version: '1.0.0',
  description: 'A template MCP server with example tools and resources',
});

// ── Register Tools ────────────────────────────────────
server.addTool(helloTool);
server.addTool(httpTool);

// ── Register Resources ────────────────────────────────
// server.addResource(myResource);

// ── Register Prompts ──────────────────────────────────
// server.addPrompt(myPrompt);

// ── Start Server ──────────────────────────────────────
server.start({
  transport: (process.env.MCP_TRANSPORT as 'stdio' | 'sse' | 'http') ?? 'stdio',
  port: Number(process.env.MCP_PORT ?? 3001),
});
