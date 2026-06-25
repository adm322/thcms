import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { isPublicHoliday } from './malaysia-holidays';

describe('isPublicHoliday', () => {
  it('should return the holiday object for a known public holiday (National)', () => {
    const result = isPublicHoliday('2026-01-01');
    assert.notEqual(result, null);
    assert.equal(result?.name, "New Year's Day");
    assert.equal(result?.type, 'NATIONAL');
    assert.equal(result?.isPublicHoliday, true);
  });

  it('should return the holiday object for a known public holiday (State)', () => {
    const result = isPublicHoliday('2026-02-01');
    assert.notEqual(result, null);
    assert.equal(result?.name, "Federal Territory Day");
    assert.equal(result?.type, 'STATE');
    assert.equal(result?.isPublicHoliday, true);
  });

  it('should return null for a date that is not a public holiday', () => {
    const result = isPublicHoliday('2026-01-02');
    assert.equal(result, null);
  });

  it('should return null for dates in different years', () => {
    const result = isPublicHoliday('2025-01-01');
    assert.equal(result, null);
  });

  it('should return null for invalid date strings', () => {
    const result = isPublicHoliday('invalid-date');
    assert.equal(result, null);
  });

  it('should return null for an empty string', () => {
    const result = isPublicHoliday('');
    assert.equal(result, null);
  });
});
