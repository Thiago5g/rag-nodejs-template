import { z, type ZodType } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface ToolConfig<TInput extends ZodType> {
  name: string;
  description: string;
  input: TInput;
  execute: (input: z.infer<TInput>) => Promise<unknown>;
}

export interface ToolDefinition<TInput = unknown> {
  name: string;
  description: string;
  inputSchema: ZodType<TInput>;
  inputJsonSchema: Record<string, unknown>;
  execute: (input: TInput) => Promise<unknown>;
}

/**
 * Define an MCP tool with type-safe input validation.
 *
 * The tool's input schema is automatically converted to JSON Schema
 * for the MCP protocol, and validated with Zod at runtime.
 *
 * @example
 * ```ts
 * const myTool = defineTool({
 *   name: 'get_user',
 *   description: 'Fetch a user by their ID',
 *   input: z.object({
 *     userId: z.string().describe('The user ID'),
 *   }),
 *   execute: async ({ userId }) => {
 *     return await db.users.findById(userId);
 *   },
 * });
 * ```
 */
export function defineTool<TInput extends ZodType>(
  config: ToolConfig<TInput>,
): ToolDefinition<z.infer<TInput>> {
  const jsonSchema = zodToJsonSchema(config.input, {
    target: 'openApi3',
    $refStrategy: 'none',
  });

  return {
    name: config.name,
    description: config.description,
    inputSchema: config.input,
    inputJsonSchema: jsonSchema as Record<string, unknown>,
    execute: config.execute,
  };
}
