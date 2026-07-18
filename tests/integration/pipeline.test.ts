import { describe, it, expect, beforeEach } from 'vitest';
import { chunkText } from '../../src/ingestion/chunker.js';
import { FakeEmbeddings } from '../../src/embeddings/provider.js';
import type { LoadedDocument } from '../../src/ingestion/loaders.js';

/**
 * Integration tests for the ingestion + retrieval flow.
 *
 * These tests validate the pipeline logic without requiring PostgreSQL.
 * They test: loading → chunking → embedding → the data shapes that
 * would be stored and searched.
 *
 * For full end-to-end tests with pgvector, see tests/e2e/ (requires Docker).
 */
describe('Pipeline Integration (no DB)', () => {
  const embeddings = new FakeEmbeddings(1536);

  const sampleDoc: LoadedDocument = {
    content: `# Introduction

This is the introduction section of the document. It explains the purpose
and gives an overview of what will be covered.

# Architecture

The system uses a microservices architecture with the following components:
- API Gateway
- User Service
- Payment Service
- Notification Service

Each service communicates via message queues for reliability.

# Deployment

Deployment is handled through Kubernetes with the following process:
1. Build Docker images
2. Push to registry
3. Apply manifests
4. Verify health checks`,
    source: '/docs/system.md',
    title: 'System Documentation',
    metadata: { type: 'markdown' },
  };

  it('chunks a document into manageable pieces', () => {
    const chunks = chunkText(sampleDoc.content, {
      chunkSize: 200,
      chunkOverlap: 50,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.length).toBeLessThan(20);

    // Each chunk should have reasonable content
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeGreaterThan(0);
      expect(chunk.content.length).toBeLessThanOrEqual(300); // Some tolerance
    }
  });

  it('generates embeddings for all chunks', async () => {
    const chunks = chunkText(sampleDoc.content, {
      chunkSize: 200,
      chunkOverlap: 50,
    });

    const texts = chunks.map((c) => c.content);
    const vectors = await embeddings.embed(texts);

    expect(vectors).toHaveLength(chunks.length);
    for (const vec of vectors) {
      expect(vec).toHaveLength(1536);
    }
  });

  it('produces different embeddings for different content', async () => {
    const introEmbedding = await embeddings.embedSingle('Introduction and overview');
    const deployEmbedding = await embeddings.embedSingle('Kubernetes deployment process');

    expect(introEmbedding).not.toEqual(deployEmbedding);
  });

  it('full pipeline data flow: load → chunk → embed', async () => {
    // Simulate the full pipeline without DB
    const chunks = chunkText(sampleDoc.content, {
      chunkSize: 200,
      chunkOverlap: 50,
    });

    const texts = chunks.map((c) => c.content);
    const vectors = await embeddings.embed(texts);

    // Build the records that would be inserted
    const records = chunks.map((chunk, i) => ({
      content: chunk.content,
      chunkIndex: chunk.index,
      metadata: { ...chunk.metadata, source: sampleDoc.source },
      embedding: vectors[i],
    }));

    // Verify record structure
    expect(records.length).toBe(chunks.length);
    for (const record of records) {
      expect(record.content).toBeTruthy();
      expect(record.embedding).toHaveLength(1536);
      expect(record.metadata.source).toBe('/docs/system.md');
      expect(typeof record.chunkIndex).toBe('number');
    }
  });

  describe('edge cases', () => {
    it('handles very short documents', () => {
      const chunks = chunkText('Short.', { chunkSize: 1000, chunkOverlap: 200 });
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('Short.');
    });

    it('handles documents with no paragraph breaks', () => {
      const text = 'Word '.repeat(500);
      const chunks = chunkText(text, { chunkSize: 100, chunkOverlap: 20 });
      expect(chunks.length).toBeGreaterThan(1);
    });

    beforeEach(() => {
      // Each test is independent
    });
  });
});
