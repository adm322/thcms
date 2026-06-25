import { test, describe } from 'node:test';
import assert from 'node:assert';
import { formatRent } from './format';

describe('formatRent', () => {
  test('formats a standard number correctly', () => {
    assert.strictEqual(formatRent(3500), 'RM 3,500/mo');
  });

  test('formats zero correctly', () => {
    assert.strictEqual(formatRent(0), 'RM 0/mo');
  });

  test('formats large numbers correctly', () => {
    assert.strictEqual(formatRent(1000000), 'RM 1,000,000/mo');
  });

  test('formats decimal values correctly', () => {
    assert.strictEqual(formatRent(1234.56), 'RM 1,234.56/mo');
  });
});
