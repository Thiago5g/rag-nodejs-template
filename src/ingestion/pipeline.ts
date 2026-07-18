import type { LoadedDocument } from './loaders.js';
import { chunkText, type ChunkOptions } from './chunker.js';
import type { EmbeddingProvider } from '../embeddings/provider.js';
import type { VectorStore } from '../store/vector-store.js';

export interface IngestResult {
  documentId: number;
  source: string;
  chunksCreated: number;
  totalCharacters: number;
}

export interface PipelineConfig {
  chunkOptions: ChunkOptions;
  batchSize?: number;
}

/**
 * Orchestrates the ingestion pipeline:
 * Document → Chunking → Embedding → Vector Store
 *
 * Processes documents one at a time to control memory usage.
 * Chunks are embedded in batches for efficiency.
 */
export class IngestionPipeline {
  private embeddings: EmbeddingProvider;
  private store: VectorStore;
  private config: PipelineConfig;

  constructor(
    embeddings: EmbeddingProvider,
    store: VectorStore,
    config: PipelineConfig,
  ) {
    this.embeddings = embeddings;
    this.store = store;
    this.config = config;
  }

  /**
   * Ingest a single document through the full pipeline.
   */
  async ingestDocument(doc: LoadedDocument): Promise<IngestResult> {
    // 1. Chunk the document
    const chunks = chunkText(doc.content, this.config.chunkOptions);

    if (chunks.length === 0) {
      throw new Error(`Document "${doc.source}" produced no chunks after splitting.`);
    }

    // 2. Generate embeddings in batches
    const batchSize = this.config.batchSize ?? 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map((c) => c.content);
      const embeddings = await this.embeddings.embed(texts);
      allEmbeddings.push(...embeddings);
    }

    // 3. Persist document record
    const documentId = await this.store.insertDocument(
      doc.source,
      doc.title,
      doc.metadata,
    );

    // 4. Persist chunks with embeddings
    const chunkRecords = chunks.map((chunk, i) => ({
      content: chunk.content,
      chunkIndex: chunk.index,
      metadata: {
        ...chunk.metadata,
        source: doc.source,
        title: doc.title,
      },
      embedding: allEmbeddings[i],
    }));

    await this.store.insertChunks(documentId, chunkRecords);

    return {
      documentId,
      source: doc.source,
      chunksCreated: chunks.length,
      totalCharacters: doc.content.length,
    };
  }

  /**
   * Ingest multiple documents, reporting progress.
   */
  async ingestDocuments(
    docs: LoadedDocument[],
    onProgress?: (result: IngestResult, index: number, total: number) => void,
  ): Promise<IngestResult[]> {
    const results: IngestResult[] = [];

    for (let i = 0; i < docs.length; i++) {
      const result = await this.ingestDocument(docs[i]);
      results.push(result);
      onProgress?.(result, i + 1, docs.length);
    }

    return results;
  }
}
