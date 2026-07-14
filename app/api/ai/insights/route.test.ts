import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "./route";
import { NextRequest } from "next/server";

// Mock auth — these tests exercise input validation, so we forge a session.
(process.env as Record<string, string>).NODE_ENV = "test";
process.env.TEST_SESSION = JSON.stringify({
  id: "test-user",
  email: "t@t.com",
  name: "T",
  role: "HR",
  companyId: "co1",
});

test("POST /api/ai/insights - returns 400 for invalid JSON", async () => {
  const request = new NextRequest("http://localhost/api/ai/insights", {
    method: "POST",
    body: "invalid-json",
  });

  const response = await POST(request, { params: Promise.resolve({}) });

  assert.equal(response.status, 400);

  const json = await response.json();
  assert.deepEqual(json, { error: "Invalid JSON" });
});

test("POST /api/ai/insights - returns 400 for missing comments", async () => {
  const request = new NextRequest("http://localhost/api/ai/insights", {
    method: "POST",
    body: JSON.stringify({}),
  });

  const response = await POST(request, { params: Promise.resolve({}) });

  assert.equal(response.status, 400);

  const json = await response.json();
  assert.match(json.error ?? "", /(expected array|comments)/i);
});

test("POST /api/ai/insights - returns 400 for non-array comments", async () => {
  const request = new NextRequest("http://localhost/api/ai/insights", {
    method: "POST",
    body: JSON.stringify({ comments: "not-an-array" }),
  });

  const response = await POST(request, { params: Promise.resolve({}) });

  assert.equal(response.status, 400);

  const json = await response.json();
  assert.match(json.error ?? "", /(expected array|comments)/i);
});
