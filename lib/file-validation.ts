/**
 * File upload validation — magic-byte sniffing + size cap.
 *
 * Why: the audit found that `lib/storage.ts` and the upload routes only check
 * the file extension. An attacker can rename `evil.html` to `evil.pdf` and
 * serve it from `/uploads/...` (PUBLIC_PREFIX in proxy.ts allows it). The
 * browser will execute uploaded HTML/SVG in the same origin → XSS.
 *
 * This module sniffs the actual byte signature and rejects mismatches.
 * Pure JS, no extra dependency.
 */

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export interface FileValidationResult {
  ok: boolean;
  detectedExt?: "pdf" | "docx" | "pptx" | "png" | "jpg" | "zip";
  error?: string;
}

interface MagicSignature {
  ext: "pdf" | "docx" | "pptx" | "png" | "jpg" | "zip";
  /** Bytes that must appear at the given offsets (any match → accept) */
  signatures: Array<{ offset: number; bytes: number[] }>;
}

/**
 * Magic-byte signatures for the formats TrainHub accepts.
 *  - PDF:  `%PDF-` at offset 0
 *  - PNG:  `\x89PNG\r\n\x1a\n` at offset 0
 *  - JPG:  `FF D8 FF` at offset 0
 *  - ZIP/DOCX/PPTX: `PK\x03\x04` at offset 0 (they are all zip containers)
 *    .docx and .pptx share the ZIP magic; we cannot distinguish them by magic
 *    alone, so we trust the extension AS WELL AS the magic for these.
 */
const SIGNATURES: MagicSignature[] = [
  { ext: "pdf", signatures: [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }] },
  { ext: "png", signatures: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }] },
  { ext: "jpg", signatures: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }] },
  {
    ext: "zip",
    signatures: [
      { offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] },
      { offset: 0, bytes: [0x50, 0x4b, 0x05, 0x06] }, // empty zip
      { offset: 0, bytes: [0x50, 0x4b, 0x07, 0x08] },
    ],
  },
];

/**
 * Sniff the magic bytes of `buffer`. Returns the detected file type.
 * Returns null if the file is not a recognized safe type.
 */
export function sniffMagicBytes(buffer: Uint8Array): MagicSignature["ext"] | null {
  for (const sig of SIGNATURES) {
    for (const candidate of sig.signatures) {
      if (buffer.length < candidate.offset + candidate.bytes.length) continue;
      let match = true;
      for (let i = 0; i < candidate.bytes.length; i++) {
        if (buffer[candidate.offset + i] !== candidate.bytes[i]) {
          match = false;
          break;
        }
      }
      if (match) return sig.ext;
    }
  }
  return null;
}

/** Extensions that are safe to serve from `/uploads/...` (PUBLIC_PREFIX). */
const SAFE_EXTENSIONS = new Set([
  "pdf", "docx", "pptx", "png", "jpg", "jpeg", "zip",
]);

/**
 * Reject obviously dangerous extensions regardless of magic bytes.
 * - `text/html`, `image/svg+xml` can carry executable JS in the TrainHub origin.
 * - Executables, scripts, server-side code: never acceptable.
 */
const BLOCKED_EXTENSIONS = new Set([
  "html", "htm", "svg", "svgz",
  "js", "mjs", "cjs", "ts", "tsx", "jsx",
  "exe", "msi", "bat", "cmd", "sh", "bash", "zsh",
  "php", "py", "rb", "pl", "cgi",
  "asp", "aspx", "jsp",
  "jar", "war",
]);

/**
 * Full validation: size, extension blocklist, magic-byte sniff.
 *
 * @param filename Original file name (used to read the extension)
 * @param buffer   First ~16 bytes are sufficient, but passing the full buffer is fine
 * @param declaredExt Optional: the extension the caller claims (for the .docx/.pptx zip case)
 */
export function validateUpload(
  filename: string,
  buffer: Uint8Array,
  declaredExt?: string
): FileValidationResult {
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)` };
  }
  if (buffer.length === 0) {
    return { ok: false, error: "Empty file" };
  }

  const ext = (filename.split(".").pop() || "").toLowerCase();

  if (BLOCKED_EXTENSIONS.has(ext)) {
    return { ok: false, error: `Extension .${ext} is not allowed` };
  }
  if (!SAFE_EXTENSIONS.has(ext)) {
    return { ok: false, error: `Extension .${ext} is not in the allowlist` };
  }

  const detected = sniffMagicBytes(buffer);
  if (!detected) {
    return { ok: false, error: "File content does not match any allowed type" };
  }

  // For .docx and .pptx, both share the ZIP magic. The detected type is `zip`;
  // we still need the extension to disambiguate.
  if (ext === "docx" || ext === "pptx") {
    if (detected !== "zip") {
      return { ok: false, error: `Extension .${ext} requires ZIP container, got ${detected}` };
    }
    // ZIP signature confirmed; trust the extension for docx/pptx.
    return { ok: true, detectedExt: ext };
  }

  // For other extensions, the detected magic must match the extension.
  // (jpg/jpeg, png, pdf, zip)
  if (ext === "jpeg" && detected === "jpg") return { ok: true, detectedExt: "jpg" };
  if (ext !== detected && ext !== detected) {
    return {
      ok: false,
      error: `Extension .${ext} does not match detected content (${detected})`,
    };
  }

  return { ok: true, detectedExt: detected };
}
