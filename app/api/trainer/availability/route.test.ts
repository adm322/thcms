import { test, mock } from "node:test";
import assert from "node:assert/strict";

mock.module("next/headers", {
  namedExports: {
    cookies: async () => ({
      get: (name: string) => name === "trainhub_session" ? { value: "fake-token" } : undefined
    })
  }
});

mock.module("jose", {
  namedExports: {
    jwtVerify: async () => ({
      payload: { role: "TRAINER", id: "1" }
    })
  }
});

test("Trainer availability PUT - Invalid JSON", async () => {
  const { PUT } = await import("./route");
  const { NextRequest } = await import("next/server");

  // Create a mock NextRequest that throws on .json() to simulate Invalid JSON
  const req = new NextRequest("http://localhost/api/trainer/availability", {
    method: "PUT",
    body: "invalid-json"
  });
  req.json = async () => { throw new Error("Invalid JSON"); };

  const res = await PUT(req);

  // Verify that the response status is 400 Bad Request
  assert.strictEqual(res.status, 400);

  // Verify that the response payload is the expected error message
  const data = await res.json();
  assert.deepStrictEqual(data, { error: "Invalid JSON" });
});
