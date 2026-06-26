import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('POST /api/ai/quiz', () => {
  test('returns 400 on invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/ai/quiz', {
      method: 'POST',
      body: 'invalid json text',
    });

    const response = await POST(req);

    assert.equal(response.status, 400);
    const data = await response.json();
    assert.deepEqual(data, { error: 'Invalid JSON' });
  });
});
