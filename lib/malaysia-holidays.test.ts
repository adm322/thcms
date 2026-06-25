import { describe, it, expect } from 'vitest';
import { isBlackoutPeriod } from './malaysia-holidays';

describe('isBlackoutPeriod', () => {
  it('should return null for dates outside blackout periods', () => {
    expect(isBlackoutPeriod('2026-01-15')).toBeNull();
    expect(isBlackoutPeriod('2026-05-15')).toBeNull();
    expect(isBlackoutPeriod('2026-11-30')).toBeNull();
  });

  describe('Hari Raya Aidilfitri (2026-04-17 to 2026-04-26)', () => {
    it('should match the start date', () => {
      expect(isBlackoutPeriod('2026-04-17')).toBe('Hari Raya Aidilfitri');
    });

    it('should match an intermediate date', () => {
      expect(isBlackoutPeriod('2026-04-22')).toBe('Hari Raya Aidilfitri');
    });

    it('should match the end date', () => {
      expect(isBlackoutPeriod('2026-04-26')).toBe('Hari Raya Aidilfitri');
    });

    it('should not match the day before', () => {
      expect(isBlackoutPeriod('2026-04-16')).toBeNull();
    });

    it('should not match the day after', () => {
      expect(isBlackoutPeriod('2026-04-27')).toBeNull();
    });
  });

  describe('Chinese New Year (2026-02-16 to 2026-02-20)', () => {
    it('should match the start date', () => {
      expect(isBlackoutPeriod('2026-02-16')).toBe('Chinese New Year');
    });

    it('should match an intermediate date', () => {
      expect(isBlackoutPeriod('2026-02-18')).toBe('Chinese New Year');
    });

    it('should match the end date', () => {
      expect(isBlackoutPeriod('2026-02-20')).toBe('Chinese New Year');
    });

    it('should not match the day before', () => {
      expect(isBlackoutPeriod('2026-02-15')).toBeNull();
    });

    it('should not match the day after', () => {
      expect(isBlackoutPeriod('2026-02-21')).toBeNull();
    });
  });

  describe('Year-End (2026-12-20 to 2026-12-31)', () => {
    it('should match the start date', () => {
      expect(isBlackoutPeriod('2026-12-20')).toBe('Year-End');
    });

    it('should match an intermediate date', () => {
      expect(isBlackoutPeriod('2026-12-25')).toBe('Year-End');
    });

    it('should match the end date', () => {
      expect(isBlackoutPeriod('2026-12-31')).toBe('Year-End');
    });

    it('should not match the day before', () => {
      expect(isBlackoutPeriod('2026-12-19')).toBeNull();
    });

    it('should not match the day after', () => {
      expect(isBlackoutPeriod('2027-01-01')).toBeNull();
    });
  });

  it('should handle time components correctly (assume midnight UTC if missing, test with time within period)', () => {
    expect(isBlackoutPeriod('2026-04-20T12:00:00Z')).toBe('Hari Raya Aidilfitri');
  });

});
