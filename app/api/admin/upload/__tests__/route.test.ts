import { test, mock } from "node:test";
import assert from "node:assert/strict";

mock.module("next/headers", {
  namedExports: {
    cookies: async () => ({
      get: (name: string) => ({ value: "fake-token" })
    })
  }
});

mock.module("jose", {
  namedExports: {
    jwtVerify: async () => ({
      payload: { role: "ADMIN", id: "1" }
    }),
    SignJWT: class {
      setProtectedHeader() { return this; }
      setIssuedAt() { return this; }
      setExpirationTime() { return this; }
      sign() { return "fake-token"; }
    }
  }
});

test("POST returns 400 for invalid form data", async () => {
  const { POST } = await import("../route");
  const { NextRequest } = await import("next/server");
  const request = new NextRequest("http://localhost/api/admin/upload", {
    method: "POST",
  });
  request.formData = async () => { throw new Error("Invalid format"); };

  const response = await POST(request);
  assert.equal(response.status, 400);

  const json = await response.json();
  assert.equal(json.error, "Invalid form data");
});
