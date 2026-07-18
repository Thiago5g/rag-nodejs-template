import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadTextFile, loadMarkdownFile, loadDirectory } from '../../src/ingestion/loaders.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('Document Loaders', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rag-test-'));

    // Create test files
    fs.writeFileSync(path.join(tempDir, 'test.txt'), 'Plain text content.');
    fs.writeFileSync(
      path.join(tempDir, 'test.md'),
      '---\ntitle: Test\n---\n# Heading\n\nMarkdown content.',
    );
    fs.writeFileSync(path.join(tempDir, 'ignored.json'), '{"not": "supported"}');

    // Create subdirectory
    fs.mkdirSync(path.join(tempDir, 'sub'));
    fs.writeFileSync(path.join(tempDir, 'sub', 'nested.txt'), 'Nested content.');
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  describe('loadTextFile', () => {
    it('loads text file content', () => {
      const doc = loadTextFile(path.join(tempDir, 'test.txt'));
      expect(doc.content).toBe('Plain text content.');
      expect(doc.title).toBe('test.txt');
      expect(doc.metadata.type).toBe('text');
    });
  });

  describe('loadMarkdownFile', () => {
    it('strips front matter and extracts title', () => {
      const doc = loadMarkdownFile(path.join(tempDir, 'test.md'));
      expect(doc.content).not.toContain('---');
      expect(doc.content).toContain('Markdown content.');
      expect(doc.title).toBe('Heading');
      expect(doc.metadata.type).toBe('markdown');
      expect(doc.metadata.hasFrontMatter).toBe(true);
    });
  });

  describe('loadDirectory', () => {
    it('loads all supported files recursively', async () => {
      const docs = await loadDirectory(tempDir);
      expect(docs.length).toBe(3); // test.txt, test.md, sub/nested.txt
    });

    it('ignores unsupported file types', async () => {
      const docs = await loadDirectory(tempDir);
      const sources = docs.map((d) => d.source);
      expect(sources.some((s) => s.endsWith('.json'))).toBe(false);
    });

    it('includes nested files', async () => {
      const docs = await loadDirectory(tempDir);
      expect(docs.some((d) => d.content === 'Nested content.')).toBe(true);
    });
  });
});
