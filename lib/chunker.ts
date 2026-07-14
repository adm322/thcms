/**
 * Text chunker — splits text into overlapping chunks by sentence boundary.
 * Target ~500 chars per chunk with 50-char overlap.
 */

export interface Chunk {
  index: number;
  text: string;
}

/**
 * Split text into chunks of approximately `chunkSize` characters,
 * using sentence boundaries (. ? !) as natural break points,
 * with `overlap` characters carried forward into the next chunk.
 */
export function chunkText(
  text: string,
  chunkSize = 500,
  overlap = 50
): Chunk[] {
  if (!text || text.trim().length === 0) return [];

  // Split into sentences using regex — . ? ! followed by space or end
  // Handle common abbreviations to avoid false splits
  const sentences = text
    .replace(/([a-z])\.([A-Z])/g, "$1. $2") // "e.g. Something" → "e.g. Something"
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const chunks: Chunk[] = [];
  let currentChunk = "";
  let index = 0;

  for (const sentence of sentences) {
    // If adding this sentence would exceed chunkSize
    if (currentChunk.length + sentence.length + 1 > chunkSize && currentChunk.length > 0) {
      chunks.push({ index: index++, text: currentChunk.trim() });

      // Start next chunk with overlap from end of previous
      const overlapText = currentChunk.slice(-overlap).trim();
      currentChunk = overlapText ? overlapText + " " + sentence : sentence;
    } else {
      currentChunk = currentChunk
        ? currentChunk + " " + sentence
        : sentence;
    }
  }

  // Push final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({ index: index, text: currentChunk.trim() });
  }

  return chunks;
}
