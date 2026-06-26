import test from "node:test";
import assert from "node:assert/strict";
import { GET } from "./route";
import { prisma } from "@/lib/prisma";

test("Trainer stats internal error", async (t) => {
  // Set up mock session
  process.env.NODE_ENV = "test";
  process.env.TEST_SESSION = JSON.stringify({
    id: "trainer-1",
    role: "TRAINER",
  });

  const originalCount = prisma.program.count;
  prisma.program.count = async () => {
    throw new Error("Database connection failed");
  };

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
