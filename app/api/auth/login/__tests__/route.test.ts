import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../route';

test('POST /api/auth/login', async (t) => {
  await t.test('returns 500 when request JSON parsing fails (e.g. invalid JSON)', async () => {
    // A request with invalid JSON throws an error when request.json() is called.
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: 'invalid-json',
    });
    const res = await POST(req);
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.deepEqual(body, { error: 'Internal server error' });
  });

  await t.test('returns 500 when request JSON parsing fails (e.g. no body)', async () => {
    // A request with no body throws an error when request.json() is called.
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
    });
    const res = await POST(req);
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.deepEqual(body, { error: 'Internal server error' });
  });

  await t.test('returns 400 when body does not match schema', async () => {
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }), // missing password
    });
    const res = await POST(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(typeof body.error, 'string');
  });
});
