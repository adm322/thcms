import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatDate } from './format.js';

describe('formatDate', () => {
  it('formats valid ISO string', () => {
    // using a timezone-agnostic string (no 'Z' or offset) so that
    // the date is evaluated correctly regardless of local timezone.
    assert.strictEqual(formatDate('2026-06-18T12:00:00'), '18 Jun 2026');
  });

  it('handles invalid date string by returning the original string', () => {
    assert.strictEqual(formatDate('invalid-date'), 'invalid-date');
  });
});
