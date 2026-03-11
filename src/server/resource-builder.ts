export interface ResourceConfig {
  uri: string;
  uriTemplate?: string;
  name: string;
  description: string;
  mimeType?: string;
  load: (params: Record<string, string>) => Promise<string>;
}

export interface ResourceDefinition {
  uri: string;
  uriTemplate?: string;
  name: string;
  description: string;
  mimeType?: string;
  load: (params: Record<string, string>) => Promise<string>;
}

/**
 * Define an MCP resource that exposes data for AI to read.
 *
 * Resources are read-only data that the AI can access. They can be
 * static (fixed URI) or dynamic (URI template with parameters).
 *
 * @example
 * ```ts
 * // Static resource
 * const configResource = defineResource({
 *   uri: 'app://config',
 *   name: 'App Configuration',
 *   description: 'Current application configuration',
 *   mimeType: 'application/json',
 *   load: async () => JSON.stringify(config),
 * });
 *
 * // Dynamic resource
 * const userResource = defineResource({
 *   uri: 'db://users',
 *   uriTemplate: 'db://users/{userId}',
 *   name: 'User Profile',
 *   description: 'User profile by ID',
 *   load: async ({ userId }) => {
 *     const user = await db.users.findById(userId);
 *     return JSON.stringify(user);
 *   },
 * });
 * ```
 */
export function defineResource(config: ResourceConfig): ResourceDefinition {
  return {
    uri: config.uri,
    uriTemplate: config.uriTemplate,
    name: config.name,
    description: config.description,
    mimeType: config.mimeType ?? 'text/plain',
    load: config.load,
  };
}
