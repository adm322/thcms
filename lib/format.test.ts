import { test, describe } from 'node:test';
import assert from 'node:assert';
import { formatRent, formatDate } from './format';

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

describe('formatDate', () => {
  test('formats valid ISO string', () => {
    // using a timezone-agnostic string (no 'Z' or offset) so that
    // the date is evaluated correctly regardless of local timezone.
    assert.strictEqual(formatDate('2026-06-18T12:00:00'), '18 Jun 2026');
  });

  test('handles invalid date string by returning the original string', () => {
    assert.strictEqual(formatDate('invalid-date'), 'invalid-date');
  });
});
