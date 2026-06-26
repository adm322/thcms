import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { isFavorableMonth, isBlackoutPeriod } from './malaysia-holidays';

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
