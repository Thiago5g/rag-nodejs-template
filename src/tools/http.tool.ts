import { defineTool } from '../server/tool-builder.js';
import { z } from 'zod';

/**
 * Example tool: HTTP Request.
 *
 * Allows the AI to make HTTP requests to external APIs.
 * Includes safety limits on response size and timeout.
 */
export const httpTool = defineTool({
  name: 'http_request',
  description:
    'Make an HTTP request to an external API. Supports GET and POST methods. Returns the response body as text or JSON.',
  input: z.object({
    url: z.string().url().describe('The full URL to request'),
    method: z.enum(['GET', 'POST']).default('GET').describe('HTTP method'),
    headers: z.record(z.string()).optional().describe('Request headers'),
    body: z.string().optional().describe('Request body (for POST requests)'),
  }),
  execute: async ({ url, method, headers, body }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'User-Agent': 'mcp-server-base/1.0',
          ...headers,
        },
        body: method === 'POST' ? body : undefined,
        signal: controller.signal,
      });

      const text = await response.text();

      // Limit response size to 50KB
      const truncated = text.length > 50_000 ? text.slice(0, 50_000) + '\n...[truncated]' : text;

      // Try to parse as JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(truncated);
      } catch {
        parsed = null;
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsed ?? truncated,
        truncated: text.length > 50_000,
      };
    } finally {
      clearTimeout(timeout);
    }
  },
});
