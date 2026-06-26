import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatRM, formatRent, formatDate } from './format';

describe('formatRM', () => {
  test('formats positive numbers correctly', () => {
    assert.equal(formatRM(3500), 'RM 3,500');
    assert.equal(formatRM(100), 'RM 100');
  });

  test('formats zero correctly', () => {
    assert.equal(formatRM(0), 'RM 0');
  });

  test('formats negative numbers correctly', () => {
    assert.equal(formatRM(-3500), 'RM -3,500');
  });

  test('formats decimal numbers correctly', () => {
    assert.equal(formatRM(3500.5), 'RM 3,500.5');
    assert.equal(formatRM(3500.55), 'RM 3,500.55');
  });

  test('formats large numbers with commas correctly', () => {
    assert.equal(formatRM(1000000), 'RM 1,000,000');
  });
});

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

  test('formats valid ISO dates correctly', () => {
    assert.equal(formatDate('2026-06-18T10:00:00.000Z'), '18 Jun 2026');
    assert.equal(formatDate('2026-06-18'), '18 Jun 2026');
  });

  test('handles invalid date string by returning the original string', () => {
    assert.strictEqual(formatDate('invalid-date'), 'invalid-date');
  });

  test('returns the original string for invalid dates', () => {
    assert.equal(formatDate('not-a-date'), 'not-a-date');
    assert.equal(formatDate(''), '');
  });
});
