import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatRM, formatRent, formatDate } from "./format";

describe("formatRM", () => {
  it("formats positive numbers correctly", () => {
    assert.equal(formatRM(3500), "RM 3,500");
    assert.equal(formatRM(100), "RM 100");
  });

  it("formats zero correctly", () => {
    assert.equal(formatRM(0), "RM 0");
  });

  it("formats negative numbers correctly", () => {
    assert.equal(formatRM(-3500), "RM -3,500");
  });

  it("formats decimal numbers correctly", () => {
    assert.equal(formatRM(3500.5), "RM 3,500.5");
    assert.equal(formatRM(3500.55), "RM 3,500.55");
  });

  it("formats large numbers with commas correctly", () => {
    assert.equal(formatRM(1000000), "RM 1,000,000");
  });
});

describe("formatRent", () => {
  it("appends /mo to the formatRM output", () => {
    assert.equal(formatRent(3500), "RM 3,500/mo");
    assert.equal(formatRent(0), "RM 0/mo");
    assert.equal(formatRent(1000000), "RM 1,000,000/mo");
  });
});

describe("formatDate", () => {
  it("formats valid ISO dates correctly", () => {
    assert.equal(formatDate("2026-06-18T10:00:00.000Z"), "18 Jun 2026");
    assert.equal(formatDate("2026-06-18"), "18 Jun 2026");
  });

  it("returns Invalid Date for invalid dates", () => {
    assert.equal(formatDate("not-a-date"), "Invalid Date");
    assert.equal(formatDate(""), "Invalid Date");
  });
});
