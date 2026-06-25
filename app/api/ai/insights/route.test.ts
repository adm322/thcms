import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "./route";
import { NextRequest } from "next/server";

test("POST /api/ai/insights - returns 400 for invalid JSON", async () => {
  const request = new NextRequest("http://localhost/api/ai/insights", {
    method: "POST",
    body: "invalid-json",
  });

  const response = await POST(request);

  assert.equal(response.status, 400);

  const json = await response.json();
  assert.deepEqual(json, { error: "Invalid JSON" });
});

test("POST /api/ai/insights - returns 400 for missing comments", async () => {
  const request = new NextRequest("http://localhost/api/ai/insights", {
    method: "POST",
    body: JSON.stringify({}),
  });

  const response = await POST(request);

  assert.equal(response.status, 400);

  const json = await response.json();
  assert.deepEqual(json, { error: "comments array required" });
});

test("POST /api/ai/insights - returns 400 for non-array comments", async () => {
  const request = new NextRequest("http://localhost/api/ai/insights", {
    method: "POST",
    body: JSON.stringify({ comments: "not-an-array" }),
  });

  const response = await POST(request);

  assert.equal(response.status, 400);

  const json = await response.json();
  assert.deepEqual(json, { error: "comments array required" });
});
