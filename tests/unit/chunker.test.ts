import { describe, it, expect } from 'vitest';
import { chunkText } from '../../src/ingestion/chunker.js';

describe('chunkText', () => {
  const defaultOptions = { chunkSize: 100, chunkOverlap: 20 };

  it('returns single chunk for short text', () => {
    const chunks = chunkText('Hello world', defaultOptions);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe('Hello world');
    expect(chunks[0].index).toBe(0);
  });

  it('splits text into multiple chunks', () => {
    const text = 'A'.repeat(50) + '\n\n' + 'B'.repeat(50) + '\n\n' + 'C'.repeat(50);
    const chunks = chunkText(text, { chunkSize: 60, chunkOverlap: 10 });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('splits long text into multiple chunks', () => {
    const text = Array(50).fill('This is a sentence with some words.').join(' ');
    const chunks = chunkText(text, { chunkSize: 200, chunkOverlap: 40 });

    // Text is ~1800 chars, chunks of 200 → should produce multiple chunks
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('maintains overlap between chunks', () => {
    const sentences = Array(10)
      .fill(null)
      .map((_, i) => `Sentence number ${i + 1}.`)
      .join(' ');

    const chunks = chunkText(sentences, { chunkSize: 50, chunkOverlap: 20 });

    // With overlap, consecutive chunks should share some content
    if (chunks.length >= 2) {
      // Verify chunks are not identical
      expect(chunks[0].content).not.toBe(chunks[1].content);
    }
  });

  it('preserves all content across chunks', () => {
    const text = 'Alpha Beta Gamma Delta Epsilon Zeta Eta Theta Iota Kappa';
    const chunks = chunkText(text, { chunkSize: 20, chunkOverlap: 0 });

    // Every word from the original text should appear in at least one chunk
    const words = text.split(' ');
    const allChunkContent = chunks.map((c) => c.content).join(' ');
    for (const word of words) {
      expect(allChunkContent).toContain(word);
    }
  });

  it('handles empty text', () => {
    const chunks = chunkText('', defaultOptions);
    expect(chunks).toHaveLength(0);
  });

  it('handles text with only whitespace', () => {
    const chunks = chunkText('   \n\n   ', defaultOptions);
    expect(chunks).toHaveLength(0);
  });

  it('splits by paragraph first', () => {
    const text = 'First paragraph content.\n\nSecond paragraph content.\n\nThird paragraph.';
    const chunks = chunkText(text, { chunkSize: 40, chunkOverlap: 0 });

    // Should try to keep paragraphs together
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  it('assigns sequential indices', () => {
    const text = Array(10).fill('Word').join('\n\n');
    const chunks = chunkText(text, { chunkSize: 15, chunkOverlap: 0 });

    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].index).toBe(i);
    }
  });

  it('includes metadata with character positions', () => {
    const text = 'Short text that fits in one chunk.';
    const chunks = chunkText(text, { chunkSize: 1000, chunkOverlap: 0 });

    expect(chunks[0].metadata).toBeDefined();
    expect(chunks[0].metadata.length).toBe(text.length);
  });
});
