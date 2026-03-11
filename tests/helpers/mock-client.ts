import type { ToolDefinition } from '../../src/server/tool-builder.js';

/**
 * Mock MCP client for unit testing tools.
 *
 * Simulates the tool call flow without needing a real MCP connection.
 *
 * @example
 * ```ts
 * const client = new MockMCPClient();
 * const result = await client.callTool(myTool, { name: 'test' });
 * expect(result.message).toBe('Hello, test!');
 * ```
 */
export class MockMCPClient {
  /**
   * Call a tool with the given input, applying Zod validation.
   */
  async callTool<TInput>(tool: ToolDefinition<TInput>, input: unknown): Promise<unknown> {
    // Validate input using the tool's schema
    const validated = tool.inputSchema.parse(input);

    // Execute the tool
    return tool.execute(validated);
  }

  /**
   * Call a tool and expect it to throw an error.
   */
  async callToolExpectError<TInput>(tool: ToolDefinition<TInput>, input: unknown): Promise<Error> {
    try {
      await this.callTool(tool, input);
      throw new Error('Expected tool to throw an error, but it succeeded');
    } catch (error) {
      return error as Error;
    }
  }
}
