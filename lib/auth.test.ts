import { test } from "node:test";
import assert from "node:assert/strict";
import { SignJWT, jwtVerify } from "jose";

/**
 * Regression tests for the JWT secret fix.
 *
 * The audit found that `lib/auth.ts` and `proxy.ts` had different fallbacks
 * for `JWT_SECRET`, which broke sessions on every server restart. Both files
 * now share the same `resolveJwtSecret()` logic. This test ensures the two
 * files remain in sync by reading each as text and asserting the fallback
 * literal matches.
 */

test("lib/auth.ts and proxy.ts share the same dev fallback secret", async () => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const root = path.resolve(import.meta.dirname ?? ".", "..");
  const authSrc = await fs.readFile(path.join(root, "lib", "auth.ts"), "utf8");
  const proxySrc = await fs.readFile(path.join(root, "proxy.ts"), "utf8");

  // Both should declare the same dev fallback literal
  const fallback = "trainhub-dev-jwt-fallback-not-for-production";
  assert.ok(
    authSrc.includes(fallback),
    "lib/auth.ts must include the shared dev fallback string"
  );
  assert.ok(
    proxySrc.includes(fallback),
    "proxy.ts must include the shared dev fallback string"
  );
});

test("lib/auth.ts throws in production when JWT_SECRET is missing", async () => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const root = path.resolve(import.meta.dirname ?? ".", "..");
  const authSrc = await fs.readFile(path.join(root, "lib", "auth.ts"), "utf8");
  assert.match(
    authSrc,
    /isProd[\s\S]*throw new Error\([\s\S]*JWT_SECRET is required in production/,
    "lib/auth.ts must throw when JWT_SECRET is missing in production"
  );
});

test("proxy.ts throws in production when JWT_SECRET is missing", async () => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const root = path.resolve(import.meta.dirname ?? ".", "..");
  const proxySrc = await fs.readFile(path.join(root, "proxy.ts"), "utf8");
  assert.match(
    proxySrc,
    /isProd[\s\S]*throw new Error\([\s\S]*JWT_SECRET is required in production/,
    "proxy.ts must throw when JWT_SECRET is missing in production"
  );
});

test("JWT round-trip: sign + verify with the shared secret", async () => {
  const secret = new TextEncoder().encode("unit-test-secret-32-bytes-long-okay");
  const token = await new SignJWT({ id: "u1", role: "HR" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret);
  const { payload } = await jwtVerify(token, secret);
  assert.equal((payload as { id: string }).id, "u1");
  assert.equal((payload as { role: string }).role, "HR");
});

test("JWT verify rejects wrong secret", async () => {
  const secret = new TextEncoder().encode("unit-test-secret-32-bytes-long-okay");
  const wrong = new TextEncoder().encode("a-different-secret-also-32-bytes-long-okay");
  const token = await new SignJWT({ id: "u1" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret);
  await assert.rejects(jwtVerify(token, wrong));
});
