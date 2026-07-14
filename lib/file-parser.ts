/**
 * File parser — extract plain text AND images from DOCX, PPTX, and PDF files.
 * Falls back to empty string on any error; never throws.
 */

import mammoth from "mammoth";
import JSZip from "jszip";
// pdfjs-dist is the underlying engine used by pdf-parse. We use it
// directly here because pdf-parse v2's CJS export tries to spawn a
// Web Worker (`./pdf.worker.mjs`) that doesn't survive Next.js webpack
// bundling. pdfjs-dist's legacy ESM build is worker-free when used with
// `useSystemFonts: true` and works under tsx + Next.js.
//
// Dynamic import keeps it out of the server-bundle's hot path until
// actually needed (PDF uploads are rare).
type PDFJSDocument = {
  numPages: number;
  getPage(n: number): Promise<{
    getTextContent(): Promise<{ items: Array<{ str?: string }> }>;
  }>;
  destroy(): Promise<void>;
};
type PDFJSLib = {
  getDocument(opts: { data: Uint8Array; useSystemFonts?: boolean }): {
    promise: Promise<PDFJSDocument>;
  };
};

async function extractTextFromPDFBuffer(buffer: Buffer): Promise<string> {
  // pdfjs-dist is ESM-only; use Function constructor to dynamically import
  // it. Avoids the CJS/ESM interop headache with Next.js bundling.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  const dynamicImport = new Function("specifier", "return import(specifier)") as (
    s: string
  ) => Promise<PDFJSLib>;
  const pdfjs = await dynamicImport("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  try {
    const pageTexts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pageTexts.push(content.items.map((it) => it.str ?? "").join(" "));
    }
    return pageTexts.join("\n\n").trim();
  } finally {
    await doc.destroy().catch(() => {});
  }
}

/**
 * Extract embedded images from a DOCX or PPTX.
 *
 * DOCX images live at `word/media/image*.{png,jpg,jpeg,gif,webp}` inside
 * the zip. We extract them and return as data URLs so the browser can
 * render them without a separate file.
 *
 * PPTX images live at `ppt/media/image*.{ext}`. Same approach.
 *
 * PDFs are not supported here — extracting raster images from a PDF
 * requires rendering every page, which is expensive. Fall back to
 * Unsplash for PDF uploads.
 *
 * Returns a list of `{ dataUrl, mimeType, size, alt? }` objects.
 */
export interface ExtractedImage {
  dataUrl: string;        // data:image/png;base64,...
  mimeType: string;        // image/png, image/jpeg, etc.
  size: number;            // bytes
  /** Optional alt-text or surrounding caption (best-effort) */
  alt?: string;
  /** Index in the source document (page or position), for ordering */
  index: number;
}

const MAX_EXTRACTED_IMAGES = 12; // cap to avoid huge JSON payloads
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB per image

export async function extractImagesFromBuffer(
  buffer: Buffer,
  detectedType: "docx" | "pptx" | "pdf"
): Promise<ExtractedImage[]> {
  if (detectedType === "pdf") return []; // PDF image extraction is expensive; fall back to Unsplash

  try {
    const zip = await JSZip.loadAsync(buffer);
    const mediaFiles: { name: string; ext: string; mime: string }[] = [];

    // Walk the zip looking for image files
    const exts = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
    for (const fileName of Object.keys(zip.files)) {
      if (!zip.files[fileName].dir) {
        const lower = fileName.toLowerCase();
        // DOCX: word/media/*    PPTX: ppt/media/*
        if (lower.includes("/media/")) {
          const ext = lower.split(".").pop() ?? "";
          if (exts.includes(ext)) {
            const mime =
              ext === "jpg" || ext === "jpeg"
                ? "image/jpeg"
                : ext === "svg"
                  ? "image/svg+xml"
                  : `image/${ext}`;
            mediaFiles.push({ name: fileName, ext, mime });
          }
        }
      }
    }

    // Sort by name to keep order stable
    mediaFiles.sort((a, b) => a.name.localeCompare(b.name));

    // Cap the count + total size
    const selected = mediaFiles.slice(0, MAX_EXTRACTED_IMAGES);
    const images: ExtractedImage[] = [];
    let index = 0;
    for (const f of selected) {
      const data = await zip.file(f.name)?.async("uint8array");
      if (!data) continue;
      if (data.byteLength > MAX_IMAGE_BYTES) continue; // skip huge
      const base64 = Buffer.from(data).toString("base64");
      images.push({
        dataUrl: `data:${f.mime};base64,${base64}`,
        mimeType: f.mime,
        size: data.byteLength,
        index: index++,
      });
    }
    return images;
  } catch (e) {
    console.error("Image extraction error:", e);
    return [];
  }
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    console.error("DOCX extraction error:", error);
    return "";
  }
}

export async function extractTextFromPPTX(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideTexts: string[] = [];

    // PPTX slides are in ppt/slides/slideN.xml
    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] ?? "0");
        const numB = parseInt(b.match(/\d+/)?.[0] ?? "0");
        return numA - numB;
      });

    for (const fileName of slideFiles) {
      const xmlContent = await zip.file(fileName)?.async("string");
      if (!xmlContent) continue;

      // Extract text from <a:t> tags (Office Open XML text nodes)
      const matches = xmlContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) ?? [];
      const slideText = matches
        .map((m) => m.replace(/<a:t[^>]*>/, "").replace(/<\/a:t>/, ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (slideText) slideTexts.push(slideText);
    }

    return slideTexts.join("\n\n");
  } catch (error) {
    console.error("PPTX extraction error:", error);
    return "";
  }
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    return await extractTextFromPDFBuffer(buffer);
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "";
  }
}

export async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  const type = file.type;

  if (
    type === "application/pdf" ||
    name.endsWith(".pdf")
  ) {
    return extractTextFromPDF(buffer);
  }

  if (
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return extractTextFromDOCX(buffer);
  }

  if (
    type ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    name.endsWith(".pptx")
  ) {
    return extractTextFromPPTX(buffer);
  }

  console.warn(`Unsupported file type for Learning Studio: ${type}`);
  return "";
}
