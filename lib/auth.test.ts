import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createToken, verifyToken, type SessionUser } from './auth';

const sampleUser: SessionUser = {
  id: 'user-1',
  email: 'admin@trainhub.com',
  name: 'Admin User',
  role: 'ADMIN',
  companyId: 'company-1',
};

describe('createToken', () => {
  test('returns a non-empty JWT string', async () => {
    const token = await createToken(sampleUser);
    assert.equal(typeof token, 'string');
    assert.ok(token.length > 0);
  });

  test('returns a token with three dot-separated parts', async () => {
    const token = await createToken(sampleUser);
    const parts = token.split('.');
    assert.equal(parts.length, 3);
  });
});

describe('verifyToken', () => {
  test('round-trips user data through create and verify', async () => {
    const token = await createToken(sampleUser);
    const decoded = await verifyToken(token);
    assert.notEqual(decoded, null);
    assert.equal(decoded!.id, sampleUser.id);
    assert.equal(decoded!.email, sampleUser.email);
    assert.equal(decoded!.name, sampleUser.name);
    assert.equal(decoded!.role, sampleUser.role);
    assert.equal(decoded!.companyId, sampleUser.companyId);
  });

  test('returns null for an invalid token', async () => {
    const result = await verifyToken('invalid.token.here');
    assert.equal(result, null);
  });

  test('returns null for an empty string', async () => {
    const result = await verifyToken('');
    assert.equal(result, null);
  });

  test('returns null for a tampered token', async () => {
    const token = await createToken(sampleUser);
    const tampered = token.slice(0, -5) + 'XXXXX';
    const result = await verifyToken(tampered);
    assert.equal(result, null);
  });

  test('preserves null companyId', async () => {
    const user: SessionUser = { ...sampleUser, companyId: null };
    const token = await createToken(user);
    const decoded = await verifyToken(token);
    assert.notEqual(decoded, null);
    assert.equal(decoded!.companyId, null);
  });

  test('works for all role types', async () => {
    for (const role of ['ADMIN', 'TRAINER', 'HR', 'PARTICIPANT'] as const) {
      const user: SessionUser = { ...sampleUser, role };
      const token = await createToken(user);
      const decoded = await verifyToken(token);
      assert.equal(decoded!.role, role);
    }
  });
});
