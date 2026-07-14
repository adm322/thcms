import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "./auth";

test("hashPassword produces a bcrypt hash", async () => {
  const hash = await hashPassword("hunter2");
  // bcrypt hashes start with $2a$ or $2b$ or $2y$
  assert.match(hash, /^\$2[aby]\$/, "should be a bcrypt hash");
  assert.notEqual(hash, "hunter2", "should not be plaintext");
});

test("verifyPassword accepts correct password with bcrypt-10 algo", async () => {
  const hash = await hashPassword("hunter2");
  assert.equal(await verifyPassword("hunter2", hash, "bcrypt-10"), true);
});

test("verifyPassword rejects wrong password with bcrypt-10 algo", async () => {
  const hash = await hashPassword("hunter2");
  assert.equal(await verifyPassword("hunter3", hash, "bcrypt-10"), false);
});

test("verifyPassword accepts correct password with legacy SHA-256 hash", async () => {
  const crypto = await import("node:crypto");
  const hash = crypto.createHash("sha256").update("password123").digest("hex");
  assert.equal(await verifyPassword("password123", hash, "sha256-legacy"), true);
  assert.equal(await verifyPassword("password123", hash, null), true, "null algo = legacy");
  assert.equal(await verifyPassword("password123", hash, null), true, "null algo = legacy");
});

test("verifyPassword rejects wrong password with legacy SHA-256 hash", async () => {
  const crypto = await import("node:crypto");
  const hash = crypto.createHash("sha256").update("password123").digest("hex");
  assert.equal(await verifyPassword("wrong", hash, "sha256-legacy"), false);
});

test("verifyPassword rejects unknown algo", async () => {
  assert.equal(await verifyPassword("password", "any", "rot13"), false);
});
