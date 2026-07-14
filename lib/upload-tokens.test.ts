import { test } from "node:test";
import assert from "node:assert/strict";
import { putUpload, takeUpload, peekUpload } from "./upload-tokens";

test("putUpload + peekUpload round-trips", () => {
  const token = putUpload({
    trainerId: "trainer-1",
    sourceText: "hello world",
    detectedFileType: "pdf",
    originalFilename: "test.pdf",
  });
  assert.equal(typeof token, "string");
  assert.ok(token.length > 20);
  const entry = peekUpload(token);
  assert.ok(entry);
  assert.equal(entry.trainerId, "trainer-1");
  assert.equal(entry.sourceText, "hello world");
  assert.equal(entry.detectedFileType, "pdf");
  assert.equal(entry.originalFilename, "test.pdf");
});

test("takeUpload returns and deletes (one-shot)", () => {
  const token = putUpload({
    trainerId: "trainer-2",
    sourceText: "secret",
    detectedFileType: "docx",
    originalFilename: "x.docx",
  });
  const first = takeUpload(token, "trainer-2");
  assert.ok(first);
  assert.equal(first.sourceText, "secret");
  // Second call: token is gone
  const second = takeUpload(token, "trainer-2");
  assert.equal(second, null);
  assert.equal(peekUpload(token), null);
});

test("takeUpload with wrong trainerId returns null (cross-tenant guard)", () => {
  const token = putUpload({
    trainerId: "trainer-A",
    sourceText: "secret",
    detectedFileType: "pdf",
    originalFilename: "a.pdf",
  });
  // Trainer B tries to use trainer A's token
  const result = takeUpload(token, "trainer-B");
  assert.equal(result, null);
  // Token should still exist (not consumed by the bad attempt)
  assert.ok(peekUpload(token));
});

test("takeUpload with unknown token returns null", () => {
  const result = takeUpload("nonexistent-token-xyz", "trainer-1");
  assert.equal(result, null);
});

test("different uploads get different tokens", () => {
  const t1 = putUpload({
    trainerId: "trainer-1",
    sourceText: "first",
    detectedFileType: "pdf",
    originalFilename: "a.pdf",
  });
  const t2 = putUpload({
    trainerId: "trainer-1",
    sourceText: "second",
    detectedFileType: "docx",
    originalFilename: "b.docx",
  });
  assert.notEqual(t1, t2);
  assert.equal(peekUpload(t1)?.sourceText, "first");
  assert.equal(peekUpload(t2)?.sourceText, "second");
});
