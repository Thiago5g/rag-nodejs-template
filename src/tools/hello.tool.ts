import { defineTool } from '../server/tool-builder.js';
import { z } from 'zod';

/**
 * Example tool: Simple greeting.
 *
 * Replace this with your own tools! This is here to demonstrate
 * the tool definition pattern and help you get started quickly.
 */
export const helloTool = defineTool({
  name: 'say_hello',
  description: 'Greet a person by name. Use this when the user asks to say hello or greet someone.',
  input: z.object({
    name: z.string().describe("The person's name to greet"),
    language: z
      .enum(['en', 'pt', 'es', 'fr'])
      .default('en')
      .describe('Language for the greeting'),
  }),
  execute: async ({ name, language }) => {
    const greetings: Record<string, string> = {
      en: `Hello, ${name}! 👋`,
      pt: `Olá, ${name}! 👋`,
      es: `¡Hola, ${name}! 👋`,
      fr: `Bonjour, ${name}! 👋`,
    };

    return {
      message: greetings[language],
      timestamp: new Date().toISOString(),
    };
  },
});
