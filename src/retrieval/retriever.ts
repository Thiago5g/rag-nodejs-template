import type { EmbeddingProvider } from '../embeddings/provider.js';
import type { VectorStore, SearchResult, SearchOptions } from '../store/vector-store.js';

export interface RetrievalResult {
  chunks: SearchResult[];
  query: string;
}

/**
 * Retriever: embeds a query and searches the vector store.
 */
export class Retriever {
  constructor(
    private embeddings: EmbeddingProvider,
    private store: VectorStore,
    private defaultTopK: number = 4,
  ) {}

  /**
   * Retrieve the most relevant chunks for a query.
   */
  async retrieve(query: string, options?: SearchOptions): Promise<RetrievalResult> {
    const queryEmbedding = await this.embeddings.embedSingle(query);

    const chunks = await this.store.search(queryEmbedding, {
      topK: options?.topK ?? this.defaultTopK,
      metadataFilter: options?.metadataFilter,
    });

    return { chunks, query };
  }
}
