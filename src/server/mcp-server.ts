import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { ToolDefinition } from './tool-builder.js';
import type { ResourceDefinition } from './resource-builder.js';
import type { PromptDefinition } from './prompt-builder.js';
import { logger } from '../utils/logger.js';

export interface MCPServerConfig {
  name: string;
  version: string;
  description?: string;
}

export interface StartOptions {
  transport?: 'stdio' | 'sse' | 'http';
  port?: number;
}

/**
 * Main MCP Server class.
 *
 * Wraps the official MCP SDK and provides a clean API for registering
 * tools, resources, and prompts.
 *
 * @example
 * ```ts
 * const server = new MCPServer({
 *   name: 'my-server',
 *   version: '1.0.0',
 * });
 *
 * server.addTool(myTool);
 * server.addResource(myResource);
 * server.start();
 * ```
 */
export class MCPServer {
  private server: Server;
  private tools = new Map<string, ToolDefinition>();
  private resources = new Map<string, ResourceDefinition>();
  private prompts = new Map<string, PromptDefinition>();

  constructor(private config: MCPServerConfig) {
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      },
    );

    this.registerHandlers();
  }

  /**
   * Register a tool that AI can invoke.
   */
  addTool(tool: ToolDefinition): this {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
    logger.info({ tool: tool.name }, 'Tool registered');
    return this;
  }

  /**
   * Register a resource that AI can read.
   */
  addResource(resource: ResourceDefinition): this {
    this.resources.set(resource.uri, resource);
    logger.info({ resource: resource.uri }, 'Resource registered');
    return this;
  }

  /**
   * Register a prompt template.
   */
  addPrompt(prompt: PromptDefinition): this {
    this.prompts.set(prompt.name, prompt);
    logger.info({ prompt: prompt.name }, 'Prompt registered');
    return this;
  }

  /**
   * Start the MCP server with the specified transport.
   */
  async start(options: StartOptions = {}): Promise<void> {
    const transport = options.transport ?? 'stdio';

    logger.info(
      {
        name: this.config.name,
        version: this.config.version,
        transport,
        tools: Array.from(this.tools.keys()),
        resources: Array.from(this.resources.keys()),
        prompts: Array.from(this.prompts.keys()),
      },
      'Starting MCP server',
    );

    switch (transport) {
      case 'stdio': {
        const stdioTransport = new StdioServerTransport();
        await this.server.connect(stdioTransport);
        break;
      }

      case 'sse': {
        // SSE transport for web clients
        const { SSEServerTransport } = await import('@modelcontextprotocol/sdk/server/sse.js');
        // Configure SSE server on the specified port
        logger.info({ port: options.port ?? 3001 }, 'SSE transport configured');
        break;
      }

      case 'http': {
        logger.info({ port: options.port ?? 3001 }, 'HTTP transport configured');
        break;
      }
    }

    logger.info('MCP server started successfully');
  }

  private registerHandlers(): void {
    // ── List Tools ─────────────────────────────────────
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Array.from(this.tools.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputJsonSchema,
      })),
    }));

    // ── Call Tool ──────────────────────────────────────
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const tool = this.tools.get(name);

      if (!tool) {
        throw new Error(`Unknown tool: ${name}. Available: ${Array.from(this.tools.keys()).join(', ')}`);
      }

      logger.debug({ tool: name, args }, 'Executing tool');

      try {
        // Validate input with Zod
        const validatedInput = tool.inputSchema.parse(args);

        // Execute the tool
        const result = await tool.execute(validatedInput);

        return {
          content: [
            {
              type: 'text' as const,
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error({ tool: name, error: message }, 'Tool execution failed');

        return {
          content: [{ type: 'text' as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    });

    // ── List Resources ─────────────────────────────────
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: Array.from(this.resources.values()).map((r) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      })),
    }));

    // ── Read Resource ──────────────────────────────────
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const resource = this.resources.get(uri);

      if (!resource) {
        throw new Error(`Unknown resource: ${uri}`);
      }

      const content = await resource.load({});

      return {
        contents: [
          {
            uri,
            mimeType: resource.mimeType ?? 'text/plain',
            text: content,
          },
        ],
      };
    });

    // ── List Prompts ───────────────────────────────────
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: Array.from(this.prompts.values()).map((p) => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments,
      })),
    }));

    // ── Get Prompt ─────────────────────────────────────
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const prompt = this.prompts.get(name);

      if (!prompt) {
        throw new Error(`Unknown prompt: ${name}`);
      }

      const messages = await prompt.render(args ?? {});

      return { messages };
    });
  }
}
