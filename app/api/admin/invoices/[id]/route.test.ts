import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

test('PATCH returns 400 when body is invalid JSON', async () => {
    // 1. Mock next/headers
    const nextHeadersPath = require.resolve('next/headers');
    require.cache[nextHeadersPath] = {
        id: nextHeadersPath,
        filename: nextHeadersPath,
        loaded: true,
        exports: {
            cookies: async () => ({
                get: (name: string) => {
                    return name === 'trainhub_session' ? { value: token } : undefined;
                }
            })
        }
    } as any;

    // 2. Load auth AFTER mocking next/headers
    const { createToken } = require('@/lib/auth');
    const token = await createToken({ id: '1', email: 'x', name: 'x', role: 'ADMIN' });

    // 3. Load route
    const { PATCH } = require('./route');

    const req = new NextRequest('http://localhost', { method: 'PATCH' });
    req.json = async () => { throw new Error('Invalid JSON'); };

    const params = Promise.resolve({ id: '123' });
    const res = await PATCH(req, { params });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.deepEqual(body, { error: 'Invalid JSON' });
});
