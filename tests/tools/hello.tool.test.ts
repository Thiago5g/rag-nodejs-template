import { describe, it, expect } from 'vitest';
import { MockMCPClient } from '../helpers/mock-client.js';
import { helloTool } from '../../src/tools/hello.tool.js';

describe('hello tool', () => {
  const client = new MockMCPClient();

  it('greets in English by default', async () => {
    const result = (await client.callTool(helloTool, { name: 'Thiago' })) as {
      message: string;
      timestamp: string;
    };

    expect(result.message).toBe('Hello, Thiago! 👋');
    expect(result.timestamp).toBeDefined();
  });

  it('greets in Portuguese', async () => {
    const result = (await client.callTool(helloTool, {
      name: 'Thiago',
      language: 'pt',
    })) as { message: string };

    expect(result.message).toBe('Olá, Thiago! 👋');
  });

  it('rejects missing name', async () => {
    await expect(client.callTool(helloTool, {})).rejects.toThrow();
  });

  it('rejects invalid language', async () => {
    await expect(
      client.callTool(helloTool, { name: 'Test', language: 'invalid' }),
    ).rejects.toThrow();
  });
});
