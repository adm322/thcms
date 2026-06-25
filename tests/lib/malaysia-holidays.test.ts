import { getHolidaysForMonth } from '../../lib/malaysia-holidays';

describe('getHolidaysForMonth', () => {
  it('should return holidays for a month with holidays (e.g., January 2026)', () => {
    // January is index 0
    const holidays = getHolidaysForMonth(2026, 0);

    expect(holidays).toBeDefined();
    expect(holidays.length).toBeGreaterThan(0);

    // Check if expected holidays are included
    const newYear = holidays.find(h => h.name === "New Year's Day");
    expect(newYear).toBeDefined();
    expect(newYear?.date).toBe('2026-01-01');

    const thaipusam = holidays.find(h => h.name === "Thaipusam");
    expect(thaipusam).toBeDefined();
    expect(thaipusam?.date).toBe('2026-01-25');
  });

  it('should return an empty array for a month with no holidays (e.g., November 2026)', () => {
    // November is index 10
    const holidays = getHolidaysForMonth(2026, 10);

    expect(holidays).toBeDefined();
    expect(holidays.length).toBe(0);
  });

  it('should return an empty array for a different year (e.g., 2025)', () => {
    // The data is strictly for 2026
    const holidays = getHolidaysForMonth(2025, 0);

    expect(holidays).toBeDefined();
    expect(holidays.length).toBe(0);
  });

  it('should handle edge cases like invalid months', () => {
    expect(getHolidaysForMonth(2026, -1).length).toBe(0);
    expect(getHolidaysForMonth(2026, 12).length).toBe(0);
  });
});
