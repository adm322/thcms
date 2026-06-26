import test from "node:test";
import assert from "node:assert/strict";
import { cn } from "./utils";

test("cn utility function", async (t) => {
  await t.test("merges basic classes correctly", () => {
    assert.equal(cn("text-red-500", "bg-blue-500"), "text-red-500 bg-blue-500");
  });

  await t.test("handles conditional classes", () => {
    assert.equal(cn("text-red-500", false && "bg-blue-500"), "text-red-500");
    assert.equal(cn("text-red-500", true && "bg-blue-500"), "text-red-500 bg-blue-500");
    assert.equal(cn("text-red-500", { "bg-blue-500": true, "text-blue-500": false }), "text-red-500 bg-blue-500");
  });

  await t.test("merges tailwind classes (overriding)", () => {
    assert.equal(cn("p-4", "p-8"), "p-8");
    assert.equal(cn("bg-red-500", "bg-blue-500"), "bg-blue-500");
    assert.equal(cn("text-sm", "text-lg"), "text-lg");
  });

  await t.test("handles arrays of classes", () => {
    assert.equal(cn(["text-red-500", "bg-blue-500"]), "text-red-500 bg-blue-500");
    assert.equal(cn(["p-4", "p-8"]), "p-8");
  });

  await t.test("handles undefined, null, and empty strings gracefully", () => {
    assert.equal(cn("text-red-500", undefined, null, "", "bg-blue-500"), "text-red-500 bg-blue-500");
  });

  await t.test("complex combinations", () => {
    const isError = true;
    const isWarning = false;

    const result = cn(
      "base-class",
      "p-4",
      {
        "text-red-500 bg-red-50": isError,
        "text-yellow-500 bg-yellow-50": isWarning,
      },
      "p-8" // This should override p-4
    );

    assert.equal(result, "base-class text-red-500 bg-red-50 p-8");
  });
});
