import fs from 'node:fs';
import path from 'node:path';

export interface LoadedDocument {
  content: string;
  source: string;
  title: string;
  metadata: Record<string, unknown>;
}

/**
 * Load a plain text file.
 */
export function loadTextFile(filePath: string): LoadedDocument {
  const content = fs.readFileSync(filePath, 'utf-8');
  return {
    content,
    source: filePath,
    title: path.basename(filePath),
    metadata: { type: 'text', extension: path.extname(filePath) },
  };
}

/**
 * Load a Markdown file. Strips front matter if present.
 */
export function loadMarkdownFile(filePath: string): LoadedDocument {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Strip YAML front matter (---...---)
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  const metadata: Record<string, unknown> = { type: 'markdown', extension: '.md' };

  if (frontMatterMatch) {
    content = content.slice(frontMatterMatch[0].length);
    metadata.hasFrontMatter = true;
  }

  // Extract title from first # heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');

  return {
    content,
    source: filePath,
    title,
    metadata,
  };
}

/**
 * Load a PDF file and extract text content.
 */
export async function loadPdfFile(filePath: string): Promise<LoadedDocument> {
  const pdfParse = (await import('pdf-parse')).default;
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  return {
    content: data.text,
    source: filePath,
    title: path.basename(filePath, '.pdf'),
    metadata: {
      type: 'pdf',
      extension: '.pdf',
      pages: data.numpages,
    },
  };
}

/**
 * Auto-detect file type and load accordingly.
 */
export async function loadFile(filePath: string): Promise<LoadedDocument> {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.md':
    case '.mdx':
      return loadMarkdownFile(filePath);
    case '.pdf':
      return loadPdfFile(filePath);
    case '.txt':
    case '.text':
      return loadTextFile(filePath);
    default:
      // Try as text for unknown extensions
      return loadTextFile(filePath);
  }
}

/**
 * Load all supported files from a directory (recursive).
 */
export async function loadDirectory(dirPath: string): Promise<LoadedDocument[]> {
  const supportedExtensions = new Set(['.txt', '.md', '.mdx', '.pdf', '.text']);
  const documents: LoadedDocument[] = [];

  function walk(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip hidden dirs and node_modules
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...walk(fullPath));
        }
      } else if (supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const files = walk(dirPath);

  for (const file of files) {
    try {
      const doc = await loadFile(file);
      documents.push(doc);
    } catch (err) {
      console.warn(`⚠ Failed to load ${file}: ${(err as Error).message}`);
    }
  }

  return documents;
}
