import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { isFavorableMonth, isBlackoutPeriod, getHariRayaDates, getBlackoutPeriods, isPublicHoliday, getActivePeriods, getRamadanStart, getHolidaysForMonth } from './malaysia-holidays';

describe('isFavorableMonth', () => {
  it('should return unfavorable for January with a warning', () => {
    assert.deepStrictEqual(isFavorableMonth(1), {
      favorable: false,
      warning: "Chinese New Year falls this month — avoid scheduling"
    });
  });

  it('should return unfavorable for February with a warning', () => {
    assert.deepStrictEqual(isFavorableMonth(2), {
      favorable: false,
      warning: "Ramadan typically falls here — expect reduced energy"
    });
  });

  it('should return favorable for March with a warning', () => {
    assert.deepStrictEqual(isFavorableMonth(3), {
      favorable: true,
      warning: "Hari Raya may fall late April — check dates"
    });
  });

  it('should return favorable for April with no warning', () => {
    assert.deepStrictEqual(isFavorableMonth(4), {
      favorable: true
    });
  });

  it('should return favorable for May with a warning', () => {
    assert.deepStrictEqual(isFavorableMonth(5), {
      favorable: true,
      warning: "Hari Raya Haji in early June — plan around it"
    });
  });

  it('should return favorable for June and July with no warning', () => {
    assert.deepStrictEqual(isFavorableMonth(6), { favorable: true });
    assert.deepStrictEqual(isFavorableMonth(7), { favorable: true });
  });

  it('should return favorable for August with a warning', () => {
    assert.deepStrictEqual(isFavorableMonth(8), {
      favorable: true,
      warning: "Merdeka Day 31 Aug — avoid that day"
    });
  });

  it('should return favorable for September with no warning', () => {
    assert.deepStrictEqual(isFavorableMonth(9), { favorable: true });
  });

  it('should return favorable for October with a warning', () => {
    assert.deepStrictEqual(isFavorableMonth(10), {
      favorable: true,
      warning: "Year-end peak approaching — schedule early Nov"
    });
  });

  it('should return unfavorable for November with a warning', () => {
    assert.deepStrictEqual(isFavorableMonth(11), {
      favorable: false,
      warning: "Year-end peak — low attendance likely, compliance refreshers only"
    });
  });

  it('should return unfavorable for December with a warning', () => {
    assert.deepStrictEqual(isFavorableMonth(12), {
      favorable: false,
      warning: "Year-end closure — avoid training"
    });
  });

  it('should default to unfavorable with year-end closure warning for invalid months (e.g. 13)', () => {
    assert.deepStrictEqual(isFavorableMonth(13), {
      favorable: false,
      warning: "Year-end closure — avoid training"
    });
  });
});

describe('isBlackoutPeriod', () => {
  it('should return null for dates outside blackout periods', () => {
    assert.equal(isBlackoutPeriod('2026-01-15'), null);
    assert.equal(isBlackoutPeriod('2026-05-15'), null);
    assert.equal(isBlackoutPeriod('2026-11-30'), null);
  });

  describe('Hari Raya Aidilfitri (2026-04-17 to 2026-04-26)', () => {
    it('should match the start date', () => {
      assert.equal(isBlackoutPeriod('2026-04-17'), 'Hari Raya Aidilfitri');
    });

    it('should match an intermediate date', () => {
      assert.equal(isBlackoutPeriod('2026-04-22'), 'Hari Raya Aidilfitri');
    });

    it('should match the end date', () => {
      assert.equal(isBlackoutPeriod('2026-04-26'), 'Hari Raya Aidilfitri');
    });

    it('should not match the day before', () => {
      assert.equal(isBlackoutPeriod('2026-04-16'), null);
    });

    it('should not match the day after', () => {
      assert.equal(isBlackoutPeriod('2026-04-27'), null);
    });
  });

  describe('Chinese New Year (2026-02-16 to 2026-02-20)', () => {
    it('should match the start date', () => {
      assert.equal(isBlackoutPeriod('2026-02-16'), 'Chinese New Year');
    });

    it('should match an intermediate date', () => {
      assert.equal(isBlackoutPeriod('2026-02-18'), 'Chinese New Year');
    });

    it('should match the end date', () => {
      assert.equal(isBlackoutPeriod('2026-02-20'), 'Chinese New Year');
    });

    it('should not match the day before', () => {
      assert.equal(isBlackoutPeriod('2026-02-15'), null);
    });

    it('should not match the day after', () => {
      assert.equal(isBlackoutPeriod('2026-02-21'), null);
    });
  });

  describe('Year-End (2026-12-20 to 2026-12-31)', () => {
    it('should match the start date', () => {
      assert.equal(isBlackoutPeriod('2026-12-20'), 'Year-End');
    });

    it('should match an intermediate date', () => {
      assert.equal(isBlackoutPeriod('2026-12-25'), 'Year-End');
    });

    it('should match the end date', () => {
      assert.equal(isBlackoutPeriod('2026-12-31'), 'Year-End');
    });

    it('should not match the day before', () => {
      assert.equal(isBlackoutPeriod('2026-12-19'), null);
    });

    it('should not match the day after', () => {
      assert.equal(isBlackoutPeriod('2027-01-01'), null);
    });
  });

  it('should handle time components correctly (assume midnight UTC if missing, test with time within period)', () => {
    assert.equal(isBlackoutPeriod('2026-04-20T12:00:00Z'), 'Hari Raya Aidilfitri');
  });
});

describe('getHariRayaDates', () => {
  it('should return the correct dates for Hari Raya', () => {
    assert.deepStrictEqual(getHariRayaDates(), ["2026-04-20", "2026-04-21"]);
  });
});

describe('getBlackoutPeriods', () => {
  it('should return the correct static array of blackout periods', () => {
    const blackoutPeriods = getBlackoutPeriods();
    assert.deepStrictEqual(blackoutPeriods, [
      { name: "Hari Raya Aidilfitri", start: "2026-04-17", end: "2026-04-26" },
      { name: "Chinese New Year", start: "2026-02-16", end: "2026-02-20" },
      { name: "Year-End", start: "2026-12-20", end: "2026-12-31" },
    ]);
  });
});

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

describe("getActivePeriods", () => {
  it("returns empty array for a date with no active periods", () => {
    const periods = getActivePeriods("2026-01-01");
    assert.deepStrictEqual(periods, []);
  });

  it("includes a period on its exact start date", () => {
    // Ramadan starts on 2026-02-18
    const periods = getActivePeriods("2026-02-18");
    assert.equal(periods.length, 1);
    assert.equal(periods[0].name, "Ramadan");
  });

  it("includes a period on its exact end date", () => {
    // Ramadan ends on 2026-03-19
    const periods = getActivePeriods("2026-03-19");
    assert.equal(periods.length, 1);
    assert.equal(periods[0].name, "Ramadan");
  });

  it("includes a period for a date strictly within it", () => {
    // 2026-02-25 is strictly within Ramadan (2026-02-18 to 2026-03-19)
    const periods = getActivePeriods("2026-02-25");
    assert.equal(periods.length, 1);
    assert.equal(periods[0].name, "Ramadan");
  });

  it("returns multiple periods when dates overlap", () => {
    // 2026-12-01 falls in both Year-End Peak Season (from 2026-11-15)
    // and Year-End School Holidays (from 2026-11-21)
    const periods = getActivePeriods("2026-12-01");

    // Using string matching to find the specific names to be robust against order changes
    const periodNames = periods.map(p => p.name);
    assert.ok(periodNames.includes("Year-End Peak Season"), "Missing Year-End Peak Season");
    assert.ok(periodNames.includes("Year-End School Holidays"), "Missing Year-End School Holidays");
    assert.equal(periods.length, 2, "Expected exactly 2 periods to match");
  });

  it("returns empty array for invalid date string", () => {
    // new Date('invalid') results in an Invalid Date object,
    // where date >= start and date <= end will both evaluate to false.
    const periods = getActivePeriods("invalid-date");
    assert.deepStrictEqual(periods, []);
  });
});

describe('getRamadanStart', () => {
  it('should return correct date for 2026', () => {
    const result = getRamadanStart();
    assert.equal(result, '2026-02-18');
  });
});

describe('getHolidaysForMonth', () => {
  it('should return holidays for a month with holidays (e.g., January 2026)', () => {
    // January is index 0
    const holidays = getHolidaysForMonth(2026, 0);

    assert.notEqual(holidays, undefined);
    assert.ok(holidays.length > 0);

    // Check if expected holidays are included
    const newYear = holidays.find(h => h.name === "New Year's Day");
    assert.notEqual(newYear, undefined);
    assert.equal(newYear?.date, '2026-01-01');

    const thaipusam = holidays.find(h => h.name === "Thaipusam");
    assert.notEqual(thaipusam, undefined);
    assert.equal(thaipusam?.date, '2026-01-25');
  });

  it('should return an empty array for a month with no holidays (e.g., November 2026)', () => {
    // November is index 10
    const holidays = getHolidaysForMonth(2026, 10);

    assert.notEqual(holidays, undefined);
    assert.equal(holidays.length, 0);
  });

  it('should return an empty array for a different year (e.g., 2025)', () => {
    // The data is strictly for 2026
    const holidays = getHolidaysForMonth(2025, 0);

    assert.notEqual(holidays, undefined);
    assert.equal(holidays.length, 0);
  });

  it('should handle edge cases like invalid months', () => {
    assert.equal(getHolidaysForMonth(2026, -1).length, 0);
    assert.equal(getHolidaysForMonth(2026, 12).length, 0);
  });
});
