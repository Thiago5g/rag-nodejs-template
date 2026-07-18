import { z } from 'zod';

const configSchema = z.object({
  // Database
  databaseUrl: z.string().url(),

  // OpenAI
  openaiApiKey: z.string().min(1),
  embeddingModel: z.string().default('text-embedding-3-small'),
  embeddingDimensions: z.coerce.number().default(1536),
  llmModel: z.string().default('gpt-4o-mini'),

  // Chunking
  chunkSize: z.coerce.number().min(100).default(1000),
  chunkOverlap: z.coerce.number().min(0).default(200),

  // Retrieval
  retrievalTopK: z.coerce.number().min(1).default(4),

  // Server
  port: z.coerce.number().default(3000),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    databaseUrl: process.env.DATABASE_URL,
    openaiApiKey: process.env.OPENAI_API_KEY,
    embeddingModel: process.env.EMBEDDING_MODEL,
    embeddingDimensions: process.env.EMBEDDING_DIMENSIONS,
    llmModel: process.env.LLM_MODEL,
    chunkSize: process.env.CHUNK_SIZE,
    chunkOverlap: process.env.CHUNK_OVERLAP,
    retrievalTopK: process.env.RETRIEVAL_TOP_K,
    port: process.env.PORT,
  });
}
