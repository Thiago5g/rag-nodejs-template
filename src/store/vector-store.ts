import pg from 'pg';
import pgvector from 'pgvector/pg';

export interface DocumentRecord {
  id: number;
  source: string;
  title: string | null;
  metadata: Record<string, unknown>;
}

export interface ChunkRecord {
  id: number;
  documentId: number;
  content: string;
  chunkIndex: number;
  metadata: Record<string, unknown>;
  embedding: number[];
}

export interface SearchResult {
  chunkId: number;
  content: string;
  source: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface SearchOptions {
  topK?: number;
  metadataFilter?: Record<string, unknown>;
}

/**
 * Vector store backed by PostgreSQL + pgvector.
 * Handles document and chunk persistence, and similarity search.
 */
export class VectorStore {
  constructor(private pool: pg.Pool) {}

  /**
   * Register pgvector type with the connection pool.
   * Must be called once before inserting/querying vectors.
   */
  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await pgvector.registerTypes(client);
    } finally {
      client.release();
    }
  }

  /**
   * Insert a document record and return its ID.
   */
  async insertDocument(
    source: string,
    title: string | null,
    metadata: Record<string, unknown> = {},
  ): Promise<number> {
    const result = await this.pool.query(
      `INSERT INTO documents (source, title, metadata)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [source, title, JSON.stringify(metadata)],
    );
    return result.rows[0].id;
  }

  /**
   * Insert a batch of chunks for a document.
   */
  async insertChunks(
    documentId: number,
    chunks: Array<{
      content: string;
      chunkIndex: number;
      metadata: Record<string, unknown>;
      embedding: number[];
    }>,
  ): Promise<number[]> {
    if (chunks.length === 0) return [];

    const ids: number[] = [];

    // Use a transaction for batch insert
    const client = await this.pool.connect();
    try {
      await pgvector.registerTypes(client);
      await client.query('BEGIN');

      for (const chunk of chunks) {
        const result = await client.query(
          `INSERT INTO chunks (document_id, content, chunk_index, metadata, embedding)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            documentId,
            chunk.content,
            chunk.chunkIndex,
            JSON.stringify(chunk.metadata),
            pgvector.toSql(chunk.embedding),
          ],
        );
        ids.push(result.rows[0].id);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return ids;
  }

  /**
   * Perform similarity search using cosine distance.
   */
  async search(
    queryEmbedding: number[],
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    const topK = options.topK ?? 4;

    let query = `
      SELECT
        c.id AS chunk_id,
        c.content,
        d.source,
        c.metadata,
        1 - (c.embedding <=> $1) AS score
      FROM chunks c
      JOIN documents d ON d.id = c.document_id
    `;

    const params: unknown[] = [pgvector.toSql(queryEmbedding)];
    let paramIndex = 2;

    // Metadata filtering
    if (options.metadataFilter && Object.keys(options.metadataFilter).length > 0) {
      query += ` WHERE c.metadata @> $${paramIndex}::jsonb`;
      params.push(JSON.stringify(options.metadataFilter));
      paramIndex++;
    }

    query += ` ORDER BY c.embedding <=> $1 LIMIT $${paramIndex}`;
    params.push(topK);

    const client = await this.pool.connect();
    try {
      await pgvector.registerTypes(client);
      const result = await client.query(query, params);

      return result.rows.map((row) => ({
        chunkId: row.chunk_id,
        content: row.content,
        source: row.source,
        score: parseFloat(row.score),
        metadata: row.metadata,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Delete a document and all its chunks.
   */
  async deleteDocument(documentId: number): Promise<void> {
    await this.pool.query('DELETE FROM documents WHERE id = $1', [documentId]);
  }

  /**
   * Get document count and chunk count for health checks.
   */
  async getStats(): Promise<{ documents: number; chunks: number }> {
    const docs = await this.pool.query('SELECT COUNT(*) FROM documents');
    const chunks = await this.pool.query('SELECT COUNT(*) FROM chunks');
    return {
      documents: parseInt(docs.rows[0].count, 10),
      chunks: parseInt(chunks.rows[0].count, 10),
    };
  }
}
