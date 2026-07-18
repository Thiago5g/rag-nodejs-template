import OpenAI from 'openai';

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  embedSingle(text: string): Promise<number[]>;
}

/**
 * OpenAI embedding provider.
 * Uses text-embedding-3-small by default (1536 dimensions).
 *
 * Handles batching automatically — OpenAI supports up to 2048 inputs per call.
 */
export class OpenAIEmbeddings implements EmbeddingProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: { apiKey: string; model?: string }) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model ?? 'text-embedding-3-small';
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    // OpenAI batch limit is 2048 inputs
    const batchSize = 2048;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.client.embeddings.create({
        model: this.model,
        input: batch,
      });

      const embeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);

      allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
  }

  async embedSingle(text: string): Promise<number[]> {
    const results = await this.embed([text]);
    return results[0];
  }
}

/**
 * Fake embedding provider for testing.
 * Generates deterministic embeddings based on text content hash.
 * Dimensions match OpenAI's text-embedding-3-small (1536).
 */
export class FakeEmbeddings implements EmbeddingProvider {
  private dimensions: number;

  constructor(dimensions = 1536) {
    this.dimensions = dimensions;
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.deterministicVector(text));
  }

  async embedSingle(text: string): Promise<number[]> {
    return this.deterministicVector(text);
  }

  private deterministicVector(text: string): number[] {
    // Simple hash-based deterministic vector generation
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }

    const vector: number[] = [];
    for (let i = 0; i < this.dimensions; i++) {
      // Use hash + index to generate pseudo-random but deterministic values
      const seed = hash + i * 7919; // prime number for distribution
      const value = Math.sin(seed) * 0.5;
      vector.push(value);
    }

    // Normalize to unit vector
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return vector.map((v) => v / magnitude);
  }
}
