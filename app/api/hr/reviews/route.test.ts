import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

// Mock auth module so that getSession allows the request through
mock.module('@/lib/auth', {
  namedExports: {
    getSession: async () => ({ id: 'hr-1', role: 'HR', companyId: 'co1', email: 'h@h.com', name: 'HR' })
  }
});

test('POST returns 400 on invalid JSON', async () => {
  // Use dynamic import so that it is evaluated after the module is mocked
  const { POST } = await import('./route');

  const req = new NextRequest('http://localhost', {
    method: 'POST',
    body: 'invalid-json'
  });

  const res = await POST(req, { params: Promise.resolve({}) });
  assert.equal(res.status, 400);

  const data = await res.json();
  assert.equal(data.error, 'Invalid JSON');
});
