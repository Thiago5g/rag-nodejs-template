<p align="center">
  <img src=".github/assets/banner.png" alt="MCP Server Base" width="100%" />
</p>

<h1 align="center">🔌 MCP Server Base</h1>

<p align="center">
  <strong>Production-ready template for building Model Context Protocol (MCP) servers in TypeScript — give AI assistants superpowers by connecting them to your APIs and data</strong>
</p>

<p align="center">
  <a href="#what-is-mcp">What is MCP?</a> •
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#building-tools">Tools</a> •
  <a href="#building-resources">Resources</a> •
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/MCP-1.0_Protocol-6B46C1?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHRleHQgeT0iMTgiIGZvbnQtc2l6ZT0iMTgiPjwvdGV4dD48L3N2Zz4=&logoColor=white" alt="MCP" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Transport-stdio_|_SSE_|_HTTP-green" alt="Transport" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License" />
  <img src="https://img.shields.io/badge/Claude-Compatible-orange" alt="Claude" />
</p>

---

## What is MCP?

The **Model Context Protocol (MCP)** is an open standard created by Anthropic that lets AI assistants (like Claude) connect to external data sources and tools. Think of it like USB-C for AI — a universal way to plug any service into any AI model.

```
┌──────────┐         MCP Protocol          ┌──────────────┐
│  Claude   │ ◄──── tools / resources ────► │  Your Server  │
│  (Client) │         stdio / SSE           │  (This repo)  │
└──────────┘                                └──────┬───────┘
                                                   │
                                            ┌──────▼───────┐
                                            │  Your APIs,   │
                                            │  Databases,   │
                                            │  Services     │
                                            └──────────────┘
```

**With this template, you can build MCP servers that give AI the ability to:**
- Query your databases
- Call your internal APIs
- Read/write files
- Interact with SaaS tools (Jira, Slack, GitHub, etc.)
- Access real-time data feeds

---

## Features

- 🛠️ **Tool System** — Define tools with Zod schemas, auto-validated inputs/outputs
- 📚 **Resource System** — Expose structured data (files, DB records, configs) to AI
- 💬 **Prompt Templates** — Pre-built prompt templates for common use cases
- 🔄 **Multi-Transport** — stdio (CLI), SSE (web), and Streamable HTTP
- ✅ **Full Validation** — Zod schemas for every tool input and output
- 🧪 **Test Utilities** — Mock MCP client for unit testing your tools
- 📋 **Auto-Discovery** — Tools and resources self-register with metadata
- 🔒 **Auth Middleware** — API key and OAuth2 authentication support
- 📊 **Logging** — Structured JSON logging with configurable levels
- 🐳 **Docker Ready** — Multi-stage Dockerfile included

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/mcp-server-base.git
cd mcp-server-base
npm install
```

### 2. Create Your First Tool

```typescript
// src/tools/hello.tool.ts
import { defineTool } from '../server/tool-builder.js';
import { z } from 'zod';

export const helloTool = defineTool({
  name: 'say_hello',
  description: 'Greets a person by name',
  input: z.object({
    name: z.string().describe('The person\'s name'),
  }),
  execute: async ({ name }) => {
    return { message: `Hello, ${name}! 👋` };
  },
});
```

### 3. Register and Run

```typescript
// src/index.ts
import { MCPServer } from './server/mcp-server.js';
import { helloTool } from './tools/hello.tool.js';

const server = new MCPServer({
  name: 'my-mcp-server',
  version: '1.0.0',
  description: 'My custom MCP server',
});

server.addTool(helloTool);
server.start(); // Starts stdio transport by default
```

### 4. Connect to Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-server-base/src/index.ts"]
    }
  }
}
```

### 5. Test

```bash
# Run the server in development
npm run dev

# Run tests
npm test

# Test with the MCP Inspector
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

---

## Project Structure

```
mcp-server-base/
├── src/
│   ├── server/
│   │   ├── mcp-server.ts           # Main server class
│   │   ├── tool-builder.ts          # Type-safe tool definition helper
│   │   ├── resource-builder.ts      # Resource definition helper
│   │   └── prompt-builder.ts        # Prompt template helper
│   ├── tools/
│   │   ├── hello.tool.ts            # Example: greeting tool
│   │   ├── database.tool.ts         # Example: database query tool
│   │   └── http.tool.ts             # Example: HTTP request tool
│   ├── resources/
│   │   ├── config.resource.ts       # Example: expose app config
│   │   └── schema.resource.ts       # Example: expose DB schema
│   ├── prompts/
│   │   └── analyze.prompt.ts        # Example: analysis prompt template
│   ├── transports/
│   │   ├── stdio.transport.ts       # Standard I/O (CLI, Claude Desktop)
│   │   └── sse.transport.ts         # Server-Sent Events (web clients)
│   ├── utils/
│   │   ├── logger.ts                # Structured logging
│   │   └── auth.ts                  # Authentication middleware
│   └── index.ts                     # Entry point
├── tests/
│   ├── tools/
│   │   └── hello.tool.test.ts
│   └── helpers/
│       └── mock-client.ts           # Mock MCP client for testing
├── examples/
│   ├── github-server/               # Example: GitHub integration
│   ├── database-server/             # Example: PostgreSQL MCP server
│   └── api-proxy-server/            # Example: REST API proxy
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

---

## Building Tools

Tools are functions that the AI can call. Define them with full type safety:

```typescript
import { defineTool } from '../server/tool-builder.js';
import { z } from 'zod';

export const searchTool = defineTool({
  name: 'search_documents',
  description: 'Search documents in the knowledge base by keyword or semantic query',
  input: z.object({
    query: z.string().describe('Search query'),
    limit: z.number().min(1).max(50).default(10).describe('Max results'),
    filters: z.object({
      category: z.string().optional(),
      dateFrom: z.string().optional(),
    }).optional(),
  }),
  execute: async ({ query, limit, filters }) => {
    // Your search logic here
    const results = await db.documents.search(query, { limit, ...filters });

    return {
      count: results.length,
      documents: results.map(doc => ({
        id: doc.id,
        title: doc.title,
        snippet: doc.content.slice(0, 200),
        relevance: doc.score,
      })),
    };
  },
});
```

### Tool Best Practices

1. **Descriptive names** — Use `verb_noun` format: `search_documents`, `create_ticket`, `get_user`
2. **Rich descriptions** — The AI uses your description to decide when to call the tool
3. **Describe every field** — Use `.describe()` on Zod fields for better AI understanding
4. **Return structured data** — Return objects, not formatted strings
5. **Handle errors gracefully** — Throw descriptive errors; the framework formats them for MCP

---

## Building Resources

Resources expose data that the AI can read:

```typescript
import { defineResource } from '../server/resource-builder.js';

export const schemaResource = defineResource({
  uri: 'db://schema',
  name: 'Database Schema',
  description: 'The current database schema with table and column definitions',
  mimeType: 'application/json',
  load: async () => {
    const tables = await db.introspect();
    return JSON.stringify(tables, null, 2);
  },
});
```

### Dynamic Resources

For resources that depend on a parameter (e.g., a specific record):

```typescript
export const userResource = defineResource({
  uriTemplate: 'db://users/{userId}',
  name: 'User Profile',
  description: 'User profile data by ID',
  mimeType: 'application/json',
  load: async (params) => {
    const user = await db.users.findById(params.userId);
    return JSON.stringify(user, null, 2);
  },
});
```

---

## Transports

### stdio (Default)

Used by Claude Desktop and CLI tools. Communication via stdin/stdout.

```typescript
server.start(); // Defaults to stdio
```

### SSE (Server-Sent Events)

For web-based MCP clients:

```typescript
server.start({ transport: 'sse', port: 3001 });
```

### Streamable HTTP

For modern HTTP-based clients:

```typescript
server.start({ transport: 'http', port: 3001 });
```

---

## Testing

The template includes a mock MCP client for unit testing:

```typescript
import { describe, it, expect } from 'vitest';
import { MockMCPClient } from '../helpers/mock-client.js';
import { helloTool } from '../../src/tools/hello.tool.js';

describe('hello tool', () => {
  const client = new MockMCPClient();

  it('greets the user', async () => {
    const result = await client.callTool(helloTool, { name: 'Thiago' });
    expect(result.message).toBe('Hello, Thiago! 👋');
  });

  it('validates input', async () => {
    await expect(client.callTool(helloTool, {})).rejects.toThrow();
  });
});
```

Use the MCP Inspector for interactive testing:

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

---

## Examples

### GitHub Server

A complete MCP server that integrates with the GitHub API:

```typescript
// examples/github-server/tools.ts
const listIssues = defineTool({
  name: 'github_list_issues',
  description: 'List open issues in a GitHub repository',
  input: z.object({
    owner: z.string(),
    repo: z.string(),
    state: z.enum(['open', 'closed', 'all']).default('open'),
    labels: z.array(z.string()).optional(),
  }),
  execute: async ({ owner, repo, state, labels }) => {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { data } = await octokit.issues.listForRepo({
      owner, repo, state, labels: labels?.join(','),
    });
    return data.map(issue => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      author: issue.user?.login,
      labels: issue.labels.map(l => typeof l === 'string' ? l : l.name),
    }));
  },
});
```

### Database Server

Expose your PostgreSQL database to AI for safe, read-only queries:

```typescript
// examples/database-server/tools.ts
const queryTool = defineTool({
  name: 'db_query',
  description: 'Execute a read-only SQL query against the database',
  input: z.object({
    sql: z.string().describe('SQL SELECT query'),
    params: z.array(z.unknown()).optional(),
  }),
  execute: async ({ sql, params }) => {
    // Safety: only allow SELECT statements
    if (!sql.trim().toUpperCase().startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed');
    }
    const result = await pool.query(sql, params);
    return { rows: result.rows, rowCount: result.rowCount };
  },
});
```

---

## Deployment

### Claude Desktop (Local)

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://..."
      }
    }
  }
}
```

### Docker

```bash
docker build -t my-mcp-server .
docker run -e DATABASE_URL=... my-mcp-server
```

### Claude.ai (Remote SSE)

Deploy your server to any cloud provider and configure it as an SSE transport:

```bash
# Deploy to your preferred platform
# Expose the SSE endpoint at https://your-server.com/mcp/sse
```

---

## Configuration

```env
# Server
MCP_SERVER_NAME=my-mcp-server
MCP_TRANSPORT=stdio          # stdio | sse | http
MCP_PORT=3001                # For SSE/HTTP transports
MCP_LOG_LEVEL=info

# Auth (for remote transports)
MCP_AUTH_TYPE=none            # none | api-key | oauth2
MCP_API_KEY=your-api-key

# Your service credentials
DATABASE_URL=postgresql://...
GITHUB_TOKEN=ghp_...
```

---

## Roadmap

- [x] Core MCP server with tool/resource/prompt support
- [x] stdio and SSE transports
- [x] Zod-based tool validation
- [x] Testing utilities
- [x] Docker support
- [ ] Streamable HTTP transport
- [ ] OAuth2 authentication flow
- [ ] Rate limiting per client
- [ ] Tool execution sandboxing
- [ ] Auto-generated tool documentation
- [ ] Plugin system for community tools

---

## Resources

- [MCP Specification](https://spec.modelcontextprotocol.io/) — Official protocol spec
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) — Official SDK
- [MCP Servers Registry](https://github.com/modelcontextprotocol/servers) — Community servers
- [Claude Desktop Docs](https://docs.anthropic.com) — Claude integration guide

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

[MIT](LICENSE) © 2025

---

<p align="center">
  <sub>Built with ❤️ and TypeScript. If this helped you, please ⭐ the repo!</sub>
</p>
#   r a g - n o d e j s - t e m p l a t e  
 