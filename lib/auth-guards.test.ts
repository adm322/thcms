import { test } from "node:test";
import assert from "node:assert/strict";
import { withAuth, type AuthContext } from "./auth-guards";
import type { NextRequest } from "next/server";

/**
 * Helper: build a fake NextRequest-like for handler invocation.
 * Only `cookies()`-adjacent paths are exercised; withAuth calls getSession()
 * which reads from cookies() — we mock that via TEST_SESSION env.
 */
function fakeRequest(): NextRequest {
  return new Request("http://localhost/test") as unknown as NextRequest;
}

function fakeRouteCtx() {
  return { params: Promise.resolve({}) };
}

const ADMIN_USER = { id: "u1", email: "a@a.com", name: "Admin", role: "ADMIN" as const, companyId: null };
const HR_USER = { id: "u2", email: "h@h.com", name: "HR", role: "HR" as const, companyId: "co1" };
const TRAINER_USER = { id: "u3", email: "t@t.com", name: "Trainer", role: "TRAINER" as const, companyId: null };
const PARTICIPANT_USER = { id: "u4", email: "p@p.com", name: "P", role: "PARTICIPANT" as const, companyId: null };

function setSession(user: object | null) {
  if (user) {
    (process.env as Record<string, string>).NODE_ENV = "test";
    process.env.TEST_SESSION = JSON.stringify(user);
  } else {
    delete process.env.TEST_SESSION;
  }
}

test("withAuth: returns 401 when no session", async () => {
  setSession(null);
  const handler = withAuth(async () => new Response("ok"));
  const res = await handler(fakeRequest(), fakeRouteCtx());
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error, "Unauthorized");
});

test("withAuth: returns 403 when role does not match", async () => {
  setSession(TRAINER_USER);
  const handler = withAuth("ADMIN", async () => new Response("ok"));
  const res = await handler(fakeRequest(), fakeRouteCtx());
  assert.equal(res.status, 403);
});

test("withAuth: passes through when role matches", async () => {
  setSession(ADMIN_USER);
  const handler = withAuth("ADMIN", async () => new Response("admin-ok"));
  const res = await handler(fakeRequest(), fakeRouteCtx());
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "admin-ok");
});

test("withAuth: accepts array of allowed roles", async () => {
  setSession(PARTICIPANT_USER);
  const handler = withAuth(["ADMIN", "PARTICIPANT"], async () => new Response("ok"));
  const res = await handler(fakeRequest(), fakeRouteCtx());
  assert.equal(res.status, 200);
});

test("withAuth: companyId=true returns 403 when companyId missing", async () => {
  setSession(ADMIN_USER); // no companyId
  const handler = withAuth({ role: "HR", companyId: true }, async () => new Response("ok"));
  const res = await handler(fakeRequest(), fakeRouteCtx());
  assert.equal(res.status, 403);
});

test("withAuth: companyId=true passes when companyId present", async () => {
  setSession(HR_USER);
  const handler = withAuth({ role: "HR", companyId: true }, async (ctx) => {
    assert.equal(ctx.session.companyId, "co1");
    return new Response("hr-ok");
  });
  const res = await handler(fakeRequest(), fakeRouteCtx());
  assert.equal(res.status, 200);
});

test("withAuth: no role restriction = any logged-in user", async () => {
  setSession(PARTICIPANT_USER);
  const handler = withAuth(async () => new Response("any"));
  const res = await handler(fakeRequest(), fakeRouteCtx());
  assert.equal(res.status, 200);
});

test("withAuth: handler receives request and params", async () => {
  setSession(ADMIN_USER);
  const handler = withAuth<{ id: string }>("ADMIN", async (ctx) => {
    assert.ok(ctx.request, "request present");
    assert.equal(ctx.params.id, "abc", "params resolved");
    return new Response("ok");
  });
  const res = await handler(fakeRequest(), { params: Promise.resolve({ id: "abc" }) });
  assert.equal(res.status, 200);
});

// cleanup
test("cleanup env", () => {
  delete process.env.TEST_SESSION;
  assert.ok(true);
});
