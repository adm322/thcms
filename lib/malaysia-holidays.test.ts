import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getActivePeriods } from "./malaysia-holidays";

describe("getActivePeriods", () => {
  test("returns empty array for a date with no active periods", () => {
    const periods = getActivePeriods("2026-01-01");
    assert.deepEqual(periods, []);
  });

  test("includes a period on its exact start date", () => {
    // Ramadan starts on 2026-02-18
    const periods = getActivePeriods("2026-02-18");
    assert.equal(periods.length, 1);
    assert.equal(periods[0].name, "Ramadan");
  });

  test("includes a period on its exact end date", () => {
    // Ramadan ends on 2026-03-19
    const periods = getActivePeriods("2026-03-19");
    assert.equal(periods.length, 1);
    assert.equal(periods[0].name, "Ramadan");
  });

  test("includes a period for a date strictly within it", () => {
    // 2026-02-25 is strictly within Ramadan (2026-02-18 to 2026-03-19)
    const periods = getActivePeriods("2026-02-25");
    assert.equal(periods.length, 1);
    assert.equal(periods[0].name, "Ramadan");
  });

  test("returns multiple periods when dates overlap", () => {
    // 2026-12-01 falls in both Year-End Peak Season (from 2026-11-15)
    // and Year-End School Holidays (from 2026-11-21)
    const periods = getActivePeriods("2026-12-01");

    // Using string matching to find the specific names to be robust against order changes
    const periodNames = periods.map(p => p.name);
    assert.ok(periodNames.includes("Year-End Peak Season"), "Missing Year-End Peak Season");
    assert.ok(periodNames.includes("Year-End School Holidays"), "Missing Year-End School Holidays");
    assert.equal(periods.length, 2, "Expected exactly 2 periods to match");
  });

  test("returns empty array for invalid date string", () => {
    // new Date('invalid') results in an Invalid Date object,
    // where date >= start and date <= end will both evaluate to false.
    const periods = getActivePeriods("invalid-date");
    assert.deepEqual(periods, []);
  });
});
