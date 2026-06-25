import test from "node:test";
import assert from "node:assert/strict";

test("Trainer availability PUT - Invalid JSON", async (t) => {
  const jose = require("jose");
  const nextHeaders = require("next/headers");

  // Create a real signed JWT token to bypass the authentication check
  const secret = process.env.JWT_SECRET || "trainhub-my-jwt-secret-key-2026-change-in-prod";
  const token = await new jose.SignJWT({ id: "1", role: "TRAINER" })
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(secret));

  // Mock next/headers cookies to return the token
  t.mock.method(nextHeaders, "cookies", async () => ({
    get: (name: string) => name === "trainhub_session" ? { value: token } : undefined
  }));

  const { PUT } = await import("./route");

  // Create a mock NextRequest that throws on .json() to simulate Invalid JSON
  const req = {
    json: async () => { throw new Error("Invalid JSON"); }
  };

  const res = await PUT(req as any);

  // Verify that the response status is 400 Bad Request
  assert.strictEqual(res.status, 400);

  // Verify that the response payload is the expected error message
  const data = await res.json();
  assert.deepStrictEqual(data, { error: "Invalid JSON" });
});
