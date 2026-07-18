import { describe, it, expect } from 'vitest';
import { FakeEmbeddings } from '../../src/embeddings/provider.js';

describe('FakeEmbeddings', () => {
  const embeddings = new FakeEmbeddings(1536);

  it('generates embedding with correct dimensions', async () => {
    const result = await embeddings.embedSingle('Hello world');
    expect(result).toHaveLength(1536);
  });

  it('generates deterministic embeddings', async () => {
    const first = await embeddings.embedSingle('test input');
    const second = await embeddings.embedSingle('test input');
    expect(first).toEqual(second);
  });

  it('generates different embeddings for different inputs', async () => {
    const a = await embeddings.embedSingle('Hello');
    const b = await embeddings.embedSingle('World');
    expect(a).not.toEqual(b);
  });

  it('handles batch embedding', async () => {
    const results = await embeddings.embed(['One', 'Two', 'Three']);
    expect(results).toHaveLength(3);
    expect(results[0]).toHaveLength(1536);
    expect(results[1]).toHaveLength(1536);
    expect(results[2]).toHaveLength(1536);
  });

  it('generates normalized vectors (unit length)', async () => {
    const vec = await embeddings.embedSingle('Normalize test');
    const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    expect(magnitude).toBeCloseTo(1.0, 5);
  });

  it('handles empty batch', async () => {
    const results = await embeddings.embed([]);
    expect(results).toHaveLength(0);
  });

  it('respects custom dimensions', async () => {
    const smallEmbeddings = new FakeEmbeddings(128);
    const result = await smallEmbeddings.embedSingle('test');
    expect(result).toHaveLength(128);
  });
});
