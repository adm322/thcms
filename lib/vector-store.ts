/**
 * SQLite vector store (pure JS — no extension needed)
 * Stores embeddings as base64-encoded float32 arrays in RAGChunk.
 */

import { prisma } from "@/lib/prisma";
import { minimaxEmbed } from "@/lib/minimax";
import { Chunk } from "@/lib/chunker";

// ─── Encoding helpers ───────────────────────────────────────────────────

function float32ToBase64(arr: number[]): string {
  const bytes = new Uint8Array(new Float32Array(arr).buffer);
  return btoa(String.fromCharCode(...bytes));
}

function base64ToFloat32(b64: string): number[] {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return Array.from(new Float32Array(bytes.buffer));
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── Insert ─────────────────────────────────────────────────────────────

export async function insertChunks(
  chunks: Chunk[],
  studioId: string
): Promise<void> {
  for (const chunk of chunks) {
    const embedding = await minimaxEmbed(chunk.text);
    if (!embedding) {
      console.warn(`Skipping chunk ${chunk.index} — embedding failed`);
      continue;
    }

    await prisma.rAGChunk.create({
      data: {
        learningStudioId: studioId,
        chunkIndex: chunk.index,
        content: chunk.text,
        embedding: float32ToBase64(embedding),
      },
    });
  }
}

// ─── Query ──────────────────────────────────────────────────────────────

export async function queryChunks(
  query: string,
  studioId: string,
  topK = 5
): Promise<{ content: string; chunkIndex: number }[]> {
  const queryEmbedding = await minimaxEmbed(query);
  if (!queryEmbedding) return [];

  const storedChunks = await prisma.rAGChunk.findMany({
    where: { learningStudioId: studioId },
    orderBy: { chunkIndex: "asc" },
  });

  const scored = storedChunks.map((chunk) => {
    const vector = base64ToFloat32(chunk.embedding);
    const score = cosineSim(queryEmbedding, vector);
    return { content: chunk.content, chunkIndex: chunk.chunkIndex, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map(({ content, chunkIndex }) => ({
    content,
    chunkIndex,
  }));
}
