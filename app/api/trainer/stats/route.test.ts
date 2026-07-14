import test from "node:test";
import assert from "node:assert/strict";
import { GET } from "./route";
import { prisma } from "@/lib/prisma";

test("Trainer stats internal error", async (t) => {
  // ponytail: NODE_ENV is read-only in TS; bypass via type assertion for test isolation
  (process.env as Record<string, string | undefined>).NODE_ENV = "test";
  process.env.TEST_SESSION = JSON.stringify({
    id: "trainer-1",
    role: "TRAINER",
  });

  const originalCount = prisma.program.count;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma.program.count = ((...args: any[]) => {
    throw new Error("Database connection failed");
  }) as typeof prisma.program.count;

  try {
    const response = await GET();
    assert.equal(response.status, 500);

    const data = await response.json();
    assert.equal(data.error, "Failed to load stats");
  } finally {
    prisma.program.count = originalCount;
    delete process.env.TEST_SESSION;
  }
});
