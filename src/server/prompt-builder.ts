export interface PromptArgument {
  name: string;
  description: string;
  required?: boolean;
}

export interface PromptMessage {
  role: 'user' | 'assistant';
  content: { type: 'text'; text: string };
}

export interface PromptConfig {
  name: string;
  description: string;
  arguments?: PromptArgument[];
  render: (args: Record<string, string>) => Promise<PromptMessage[]>;
}

export interface PromptDefinition {
  name: string;
  description: string;
  arguments?: PromptArgument[];
  render: (args: Record<string, string>) => Promise<PromptMessage[]>;
}

/**
 * Define a reusable prompt template for the MCP server.
 *
 * @example
 * ```ts
 * const analyzePrompt = definePrompt({
 *   name: 'analyze_data',
 *   description: 'Analyze a dataset and provide insights',
 *   arguments: [
 *     { name: 'topic', description: 'What to analyze', required: true },
 *     { name: 'depth', description: 'Analysis depth: brief | detailed', required: false },
 *   ],
 *   render: async ({ topic, depth = 'brief' }) => [
 *     {
 *       role: 'user',
 *       content: {
 *         type: 'text',
 *         text: `Analyze the following topic: ${topic}\nDepth: ${depth}`,
 *       },
 *     },
 *   ],
 * });
 * ```
 */
export function definePrompt(config: PromptConfig): PromptDefinition {
  return config;
}
