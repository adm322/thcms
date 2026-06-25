import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { isFavorableMonth } from './malaysia-holidays';

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
