import { test } from "node:test";
import assert from "node:assert/strict";
import { validateUpload, sniffMagicBytes, MAX_UPLOAD_BYTES } from "./file-validation";

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const ZIP_BYTES = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
const HTML_BYTES = new Uint8Array([0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45]); // <!DOCTYPE
const EXE_BYTES = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // MZ
const EMPTY = new Uint8Array(0);

test("sniffMagicBytes: detects PDF", () => {
  assert.equal(sniffMagicBytes(PDF_BYTES), "pdf");
});

test("sniffMagicBytes: detects PNG", () => {
  assert.equal(sniffMagicBytes(PNG_BYTES), "png");
});

test("sniffMagicBytes: detects JPG", () => {
  assert.equal(sniffMagicBytes(JPG_BYTES), "jpg");
});

test("sniffMagicBytes: detects ZIP (which is also the magic for .docx/.pptx)", () => {
  assert.equal(sniffMagicBytes(ZIP_BYTES), "zip");
});

test("sniffMagicBytes: returns null for HTML", () => {
  assert.equal(sniffMagicBytes(HTML_BYTES), null);
});

test("sniffMagicBytes: returns null for empty buffer", () => {
  assert.equal(sniffMagicBytes(EMPTY), null);
});

test("sniffMagicBytes: returns null for EXE magic", () => {
  assert.equal(sniffMagicBytes(EXE_BYTES), null);
});

test("validateUpload: accepts a real PDF with .pdf extension", () => {
  const r = validateUpload("doc.pdf", PDF_BYTES);
  assert.equal(r.ok, true);
  assert.equal(r.detectedExt, "pdf");
});

test("validateUpload: accepts a real PNG with .png extension", () => {
  const r = validateUpload("img.png", PNG_BYTES);
  assert.equal(r.ok, true);
  assert.equal(r.detectedExt, "png");
});

test("validateUpload: accepts a real JPG with .jpg extension", () => {
  const r = validateUpload("img.jpg", JPG_BYTES);
  assert.equal(r.ok, true);
});

test("validateUpload: accepts a real JPG with .jpeg extension", () => {
  const r = validateUpload("img.jpeg", JPG_BYTES);
  assert.equal(r.ok, true);
});

test("validateUpload: accepts a .docx with ZIP magic (Office format)", () => {
  const r = validateUpload("doc.docx", ZIP_BYTES);
  assert.equal(r.ok, true);
  assert.equal(r.detectedExt, "docx");
});

test("validateUpload: accepts a .pptx with ZIP magic", () => {
  const r = validateUpload("slides.pptx", ZIP_BYTES);
  assert.equal(r.ok, true);
  assert.equal(r.detectedExt, "pptx");
});

test("validateUpload: REJECTS HTML renamed to .pdf (XSS attack vector)", () => {
  const r = validateUpload("evil.pdf", HTML_BYTES);
  assert.equal(r.ok, false);
  assert.match(r.error ?? "", /content does not match/);
});

test("validateUpload: REJECTS HTML with .html extension", () => {
  const r = validateUpload("evil.html", HTML_BYTES);
  assert.equal(r.ok, false);
  assert.match(r.error ?? "", /not allowed/);
});

test("validateUpload: REJECTS SVG with .svg extension", () => {
  const r = validateUpload("evil.svg", HTML_BYTES);
  assert.equal(r.ok, false);
  assert.match(r.error ?? "", /not allowed/);
});

test("validateUpload: REJECTS .js, .sh, .exe extensions", () => {
  assert.equal(validateUpload("script.js", EXE_BYTES).ok, false);
  assert.equal(validateUpload("script.sh", EXE_BYTES).ok, false);
  assert.equal(validateUpload("app.exe", EXE_BYTES).ok, false);
});

test("validateUpload: REJECTS extension not in allowlist", () => {
  const r = validateUpload("file.xyz", PDF_BYTES);
  assert.equal(r.ok, false);
  assert.match(r.error ?? "", /allowlist/);
});

test("validateUpload: REJECTS empty file", () => {
  const r = validateUpload("doc.pdf", EMPTY);
  assert.equal(r.ok, false);
  assert.match(r.error ?? "", /Empty/);
});

test("validateUpload: REJECTS file exceeding MAX_UPLOAD_BYTES", () => {
  const big = new Uint8Array(MAX_UPLOAD_BYTES + 1);
  // Set the first 4 bytes to a PDF signature so it would otherwise pass the magic check
  big[0] = 0x25; big[1] = 0x50; big[2] = 0x44; big[3] = 0x46;
  const r = validateUpload("big.pdf", big);
  assert.equal(r.ok, false);
  assert.match(r.error ?? "", /too large/);
});

test("validateUpload: REJECTS extension/magic mismatch (PNG magic + .pdf ext)", () => {
  const r = validateUpload("img.pdf", PNG_BYTES);
  assert.equal(r.ok, false);
  assert.match(r.error ?? "", /does not match/);
});
