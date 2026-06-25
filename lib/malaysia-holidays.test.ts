import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getBlackoutPeriods } from './malaysia-holidays';

test('getBlackoutPeriods returns the correct static array of blackout periods', () => {
  const blackoutPeriods = getBlackoutPeriods();

  assert.deepEqual(blackoutPeriods, [
    { name: "Hari Raya Aidilfitri", start: "2026-04-17", end: "2026-04-26" },
    { name: "Chinese New Year", start: "2026-02-16", end: "2026-02-20" },
    { name: "Year-End", start: "2026-12-20", end: "2026-12-31" },
  ]);
});
