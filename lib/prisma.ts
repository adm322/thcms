import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";

  // ponytail: if using PostgreSQL (InsForge), use standard PrismaPg adapter
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    const cleanUrl = url.replace(/[\?&]sslmode=[^&]+/i, "");
    const pool = new Pool({
      connectionString: cleanUrl,
      ssl: url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  const authToken = process.env.TURSO_AUTH_TOKEN;
  const adapter = new PrismaLibSql({
    url,
    ...(authToken ? { authToken } : {}),
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
