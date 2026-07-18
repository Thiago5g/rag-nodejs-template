export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
}

export interface Chunk {
  content: string;
  index: number;
  metadata: {
    startChar: number;
    endChar: number;
    length: number;
  };
}

const DEFAULT_SEPARATORS = ['\n\n', '\n', '. ', ' ', ''];

/**
 * Recursive character text splitter.
 *
 * Splits text by trying each separator in order, ensuring chunks
 * don't exceed the configured size. Preserves overlap between chunks
 * for context continuity.
 *
 * Based on the same algorithm used in LangChain's RecursiveCharacterTextSplitter
 * but implemented from scratch for transparency and zero dependencies.
 */
export function chunkText(text: string, options: ChunkOptions): Chunk[] {
  const { chunkSize, chunkOverlap, separators = DEFAULT_SEPARATORS } = options;

  // Handle empty or whitespace-only text
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return [];
  }

  if (trimmed.length <= chunkSize) {
    return [
      {
        content: trimmed,
        index: 0,
        metadata: { startChar: 0, endChar: text.length, length: trimmed.length },
      },
    ];
  }

  const splits = splitBySeparator(text, separators);
  return mergeSplits(splits, chunkSize, chunkOverlap);
}

/**
 * Recursively split text using the first separator that produces
 * chunks small enough, falling back to subsequent separators.
 */
function splitBySeparator(text: string, separators: string[]): string[] {
  if (separators.length === 0 || text.length === 0) {
    return [text];
  }

  const [currentSep, ...remainingSeps] = separators;

  // Empty separator = split by character
  const parts = currentSep === '' ? [...text] : text.split(currentSep);

  const result: string[] = [];

  for (const part of parts) {
    if (part.length === 0) continue;

    // Re-attach separator for non-empty separators
    const piece = currentSep && currentSep !== '' ? part + currentSep : part;

    if (piece.length <= 1000) {
      result.push(piece);
    } else {
      // Piece is too large, recurse with next separator
      result.push(...splitBySeparator(piece, remainingSeps));
    }
  }

  return result;
}

/**
 * Merge splits into chunks respecting size and overlap constraints.
 */
function mergeSplits(splits: string[], chunkSize: number, chunkOverlap: number): Chunk[] {
  const chunks: Chunk[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;
  let charOffset = 0;

  for (const split of splits) {
    const splitLength = split.length;

    // If adding this split exceeds chunk size, finalize current chunk
    if (currentLength + splitLength > chunkSize && currentChunk.length > 0) {
      const chunkContent = currentChunk.join('').trim();

      if (chunkContent.length > 0) {
        chunks.push({
          content: chunkContent,
          index: chunks.length,
          metadata: {
            startChar: charOffset - currentLength,
            endChar: charOffset,
            length: chunkContent.length,
          },
        });
      }

      // Keep overlap: remove from beginning until we're under overlap size
      while (currentLength > chunkOverlap && currentChunk.length > 1) {
        const removed = currentChunk.shift()!;
        currentLength -= removed.length;
      }
    }

    currentChunk.push(split);
    currentLength += splitLength;
    charOffset += splitLength;
  }

  // Final chunk
  if (currentChunk.length > 0) {
    const chunkContent = currentChunk.join('').trim();
    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        index: chunks.length,
        metadata: {
          startChar: charOffset - currentLength,
          endChar: charOffset,
          length: chunkContent.length,
        },
      });
    }
  }

  return chunks;
}
