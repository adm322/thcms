import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimit, getClientIp } from "./rate-limit";

test("rateLimit allows up to `max` requests in a window", () => {
  const key = `test:${Math.random()}`;
  assert.equal(rateLimit(key, 3, 60_000), true, "1st ok");
  assert.equal(rateLimit(key, 3, 60_000), true, "2nd ok");
  assert.equal(rateLimit(key, 3, 60_000), true, "3rd ok");
  assert.equal(rateLimit(key, 3, 60_000), false, "4th denied");
});

test("rateLimit buckets are independent per key", () => {
  const a = `test:a:${Math.random()}`;
  const b = `test:b:${Math.random()}`;
  assert.equal(rateLimit(a, 1, 60_000), true);
  assert.equal(rateLimit(a, 1, 60_000), false, "a exhausted");
  assert.equal(rateLimit(b, 1, 60_000), true, "b is independent");
});

test("rateLimit refills tokens after the window elapses", async () => {
  const key = `test:refill:${Math.random()}`;
  // 50ms window for testability
  assert.equal(rateLimit(key, 2, 50), true);
  assert.equal(rateLimit(key, 2, 50), true);
  assert.equal(rateLimit(key, 2, 50), false, "exhausted");
  // wait just over 50ms for the bucket to refill
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(rateLimit(key, 2, 50), true, "refilled");
});

test("getClientIp returns first x-forwarded-for entry", () => {
  const req = new Request("http://x", {
    headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
  });
  assert.equal(getClientIp(req), "1.2.3.4");
});

test("getClientIp falls back to x-real-ip", () => {
  const req = new Request("http://x", { headers: { "x-real-ip": "9.9.9.9" } });
  assert.equal(getClientIp(req), "9.9.9.9");
});

test("getClientIp returns 'unknown' when no headers", () => {
  const req = new Request("http://x");
  assert.equal(getClientIp(req), "unknown");
});
