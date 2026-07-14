/**
 * In-memory store for source text extracted from trainer uploads.
 *
 * Flow:
 *   1. Trainer drops a DOCX/PPTX/PDF on /trainer/programs/new
 *   2. /api/trainer/programs/extract returns { draft, uploadToken, ... }
 *   3. The page holds the token in client state
 *   4. On Save, the page POSTs { ..., uploadToken, enqueueStudio: true }
 *   5. /api/trainer/programs/batch reads the source text from this store
 *      and kicks off the background studio generation
 *
 * Entries expire after 1 hour. Expired entries are removed lazily on access
 * (no background timer) — adequate for a single-user flow.
 *
 * Limitation: in-memory only. If the Next.js process restarts between
 * extract and save, the token is invalidated and the trainer must
 * re-upload. Multi-instance deploys need a shared store (Redis).
 */

import crypto from "node:crypto";

export interface ExtractedImage {
  dataUrl: string;        // data:image/png;base64,...
  mimeType: string;
  size: number;
  alt?: string;
  index: number;
}

interface StoredUpload {
  trainerId: string;
  sourceText: string;
  detectedFileType: "docx" | "pptx" | "pdf";
  originalFilename: string;
  createdAt: number;
  /** Embedded images extracted from the source (DOCX/PPTX only). */
  images: ExtractedImage[];
}

const TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_ENTRIES = 500;        // safety cap to avoid unbounded growth

// globalThis to survive HMR in dev
const g = globalThis as unknown as { __uploadTokens?: Map<string, StoredUpload> };
const store: Map<string, StoredUpload> = g.__uploadTokens ?? new Map();
g.__uploadTokens = store;

function gc(): void {
  const now = Date.now();
  for (const [token, entry] of store) {
    if (now - entry.createdAt > TTL_MS) store.delete(token);
  }
  // Bound the size
  if (store.size > MAX_ENTRIES) {
    const toRemove = store.size - MAX_ENTRIES;
    const iter = store.keys();
    for (let i = 0; i < toRemove; i++) store.delete(iter.next().value as string);
  }
}

/** Store the source text + images from a trainer's upload, returning a token. */
export function putUpload(input: {
  trainerId: string;
  sourceText: string;
  detectedFileType: "docx" | "pptx" | "pdf";
  originalFilename: string;
  images?: ExtractedImage[];
}): string {
  gc();
  const token = crypto.randomBytes(24).toString("base64url");
  store.set(token, {
    trainerId: input.trainerId,
    sourceText: input.sourceText,
    detectedFileType: input.detectedFileType,
    originalFilename: input.originalFilename,
    images: input.images ?? [],
    createdAt: Date.now(),
  });
  return token;
}

/**
 * Look up a token and atomically delete it (one-shot use — the token
 * is invalidated after the batch endpoint consumes it, so a refresh on
 * the save page can't accidentally re-trigger studio generation).
 *
 * Returns null if the token is unknown, expired, or belongs to a
 * different trainer (cross-tenant guard).
 */
export function takeUpload(token: string, trainerId: string): StoredUpload | null {
  gc();
  const entry = store.get(token);
  if (!entry) return null;
  if (entry.trainerId !== trainerId) return null;
  store.delete(token); // one-shot
  return entry;
}

/** Peek without deleting — used by tests. */
export function peekUpload(token: string): StoredUpload | null {
  gc();
  return store.get(token) ?? null;
}
