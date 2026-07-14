# SRE Runtime Performance & Connection Pooling Audit

**Audited:** 2026-06-28
**Scope:** `lib/prisma.ts`, `next.config.ts`, `app/(dashboard)/admin/page.tsx`, `lib/services/admin.service.ts`
**Runtime:** Next.js 16.2.9 standalone build, Prisma 7.8, SQLite (Turso) / PostgreSQL (InsForge)

---

## Finding 1: Silent Error Swallowing on Every Admin Service Call

**File:** `app/(dashboard)/admin/page.tsx` (lines 17–21)

**Problem:**
Every service call is wrapped in `.catch(() => ({ fallback }))`, which silently swallows all errors without logging, alerting, or surfacing the failure to monitoring:

```ts
const stats = await getAdminStats().catch(() => ({
  totalBookings: 0, totalTrainers: 0, totalPrograms: 0,
  totalRevenue: 0, pendingBookings: 0, pendingReimbursements: 0,
}));
```

A database timeout, constraint violation, or network partition will cause the admin dashboard to render with **zeroes silently** — indistinguishable from a real empty state. The admin sees no error, gets no alert, and the issue is invisible until a user complains.

**Impact:**
- MTTR (Mean Time To Recovery) becomes undefined — errors have no signal
- Root cause is impossible to determine from logs (nothing is logged)
- Production incidents go undetected

**Recommended Fix:**
```ts
// Option A: Let the error propagate with structured logging
import { logger } from "@/lib/logger"; // or console.error in interim

const stats = await getAdminStats().catch((err) => {
  console.error("[admin/dashboard] getAdminStats failed:", err);
  return { totalBookings: 0, /* ... */ }; // still return fallback
});

// Option B: Wrap with a typed result union
type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string };

// Option C: Install Sentry + use captureException
import * as Sentry from "@sentry/nextjs";
const stats = await getAdminStats().catch((err) => {
  Sentry.captureException(err, { extra: { service: "getAdminStats" } });
  return fallback;
});
```

**Risk if not fixed:** **HIGH** — silent failures mask outages with no observability path.

---

## Finding 2: Sequential DB Queries — Blocked TTFB on Every Request

**File:** `app/(dashboard)/admin/page.tsx` (lines 17–21)

**Problem:**
The 5 service calls execute **sequentially** (no `Promise.all`). Each one must complete before the next starts:

```
getAdminStats         → await → ~2-4 queries (count, count, count, findMany)
getAdminCalendar      → await → ~3 queries (findMany × 3)
getAdminChangelog     → await → 1 query (findMany)
getAdminTrainingPlans → await → 1 query (findMany with nested include)
getAdminActions       → await → ~3 queries (findMany × 2 + count)
```

Total: **~10–12 sequential queries**. On a cold start (serverless), each SQLite/Turso query adds ~5–50ms latency. With Next.js server cold-start overhead (~500ms–2s), total TTFB easily reaches **2–4 seconds**.

The comment on line 15 says "sequential to prevent database connection spikes since we don't have PgBouncer" — but this is a **trade-off that trades latency for connection safety**. For an internal admin tool, this may be acceptable, but it should be an explicit design decision documented.

**Recommended Fix:**

1. **Parallelize where safe** (acceptable for non-critical admin dashboard):
   ```ts
   const [stats, calData, changelog, planData, actData] = await Promise.all([
     getAdminStats().catch(e => { console.error(e); return fallbackStats; }),
     getAdminCalendar().catch(e => { console.error(e); return fallbackCalendar; }),
     getAdminChangelog().catch(e => { console.error(e); return fallbackChangelog; }),
     getAdminTrainingPlans(currentYear).catch(e => { console.error(e); return fallbackPlans; }),
     getAdminActions().catch(e => { console.error(e); return fallbackActions; }),
   ]);
   ```
   This reduces worst-case latency from ~sum(individual times) to ~max(individual times) — potentially **5× improvement** in TTFB.

2. **Add caching with revalidation** for slowly-changing data:
   ```ts
   import { unstable_cache } from "next/cache";
   
   const getCachedStats = unstable_cache(getAdminStats, ["admin-stats"], {
     revalidate: 60, // cache for 60 seconds
     tags: ["admin-stats"],
   });
   ```

3. **If PgBouncer is needed for InsForge PostgreSQL:** configure it externally (not in-app); the comment is accurate that there's no in-process PgBouncer.

**Risk if not fixed:** **MEDIUM** — slow admin UX, but functionally correct. Production user-facing pages are more critical.

---

## Finding 3: No Sentry / APM / Error Tracking Integration

**Files:** `package.json` (absent), all source files (no instrumentation)

**Problem:**
There is zero error tracking, performance monitoring, or distributed tracing:
- No `@sentry/nextjs` in dependencies
- No custom `logger` module
- No `console.error` for service failures
- No latency metrics on DB queries

Without observability, diagnosing slow requests, connection exhaustion, or silent failures requires manual log spelunking or user reports.

**Recommended Fix:**

1. Install Sentry:
   ```bash
   npm install @sentry/nextjs
   npx sentry-wizard -i nextjs
   ```
   This auto-instruments API routes, page performance, and uncaught exceptions.

2. Add structured logging to service layer:
   ```ts
   // lib/logger.ts
   export const logger = {
     error: (ctx: string, err: unknown) =>
       console.error(JSON.stringify({ level: "error", ctx, err })),
     info: (ctx: string, data?: object) =>
       console.log(JSON.stringify({ level: "info", ctx, ...data })),
   };
   ```

3. Add Prisma query logging in development:
   ```ts
   // lib/prisma.ts — add to PrismaClient constructor
   new PrismaClient({
     adapter,
     log: process.env.NODE_ENV === "development"
       ? ["query", "error", "warn"]
       : ["error"],
   });
   ```

**Risk if not fixed:** **HIGH** — incidents will be discovered reactively via user reports rather than proactive alerting.

---

## Finding 4: Prisma Connection Pooling — Pool Config Missing URL-level `connection_limit`

**File:** `lib/prisma.ts` (lines 14–26)

**Problem:**
For the InsForge PostgreSQL path, a `pg.Pool` is created with `max: 10` connections:

```ts
const pool = new Pool({
  connectionString: cleanUrl,
  ssl: url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});
```

However, there is **no `connection_limit=N` parameter appended to the `DATABASE_URL`** itself. When running on managed PostgreSQL (InsForge), the database server also enforces a per-user connection limit. If the application creates 10 connections in the pool, but the server allows only 5 per user, connections will be refused with no retry.

The comment "no PgBouncer running" on the admin page is misleading — PgBouncer would pool connections at the infrastructure level; the application-level `max: 10` is correct, but the DATABASE_URL connection limit is the missing piece.

**Recommended Fix:**

```ts
// Option A: Append connection_limit to the URL
const connLimit = process.env.DB_CONNECTION_LIMIT ?? "5";
const pool = new Pool({
  connectionString: `${cleanUrl}${cleanUrl.includes("?") ? "&" : "?"}connection_limit=${connLimit}`,
  max: Number(process.env.DB_POOL_MAX ?? "10"),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

// Option B: Use PgBouncer externally (recommended for production)
// The application code doesn't need to change — configure PgBouncer
// in front of PostgreSQL and set DATABASE_URL to point to it.
```

**Risk if not fixed:** **MEDIUM** — connection exhaustion under load if server-side limit is lower than `max: 10`.

---

## Finding 5: LibSQL Adapter — No Explicit Connection Management for Serverless

**File:** `lib/prisma.ts` (lines 28–34)

**Problem:**
The `PrismaLibSql` adapter is created without any connection management configuration:

```ts
const adapter = new PrismaLibSql({
  url,
  ...(authToken ? { authToken } : {}),
});
```

For Turso remote SQLite, the libsql client creates connections lazily. On serverless (standalone deployment), each cold invocation initializes a new PrismaClient via the `globalForPrisma` singleton. However:

1. **No explicit `maxConnections`** — Turso's free tier has a 10-connection limit per database; under concurrent serverless invocations, connection contention is possible.
2. **No `fetch retries`** — network blips between serverless function and Turso edge nodes will fail immediately.
3. **SQLite file (`file:./dev.db`)** — for local dev, this is fine, but `standalone` builds running on Windows Server will have file-locking issues if multiple instances try to access `dev.db`.

**Recommended Fix:**

```ts
// lib/prisma.ts — Turso path
const adapter = new PrismaLibSql({
  url,
  authToken: authToken ?? undefined,
  // libsql client options
  maxConnections: Number(process.env.TURSO_MAX_CONNECTIONS ?? "5"),
  // retry: true by default in libsql, but be explicit:
  fetchRetry: { maxRetries: 3, retryInterval: 500 },
});
```

For production serverless deployments, also set `TURSO_DATABASE_URL` to a Turso cloud database (not a local `file:` URL).

**Risk if not fixed:** **MEDIUM** — Turso connection exhaustion under concurrent load; local `file:` URL will fail silently on multi-instance deployments.

---

## Finding 6: `DATABASE_URL` Defaults to Local File in Production-unsafe Manner

**File:** `.env` (line 1) + `lib/prisma.ts` (line 12)

**Problem:**
```ts
const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";
```

The fallback to `file:./dev.db` means if neither env var is set, the app silently connects to a local SQLite file. In a serverless standalone deployment, `file:./dev.db` resolves relative to the working directory — which is undefined at cold start — causing silent failures or data corruption.

**Recommended Fix:**
```ts
if (!process.env.TURSO_DATABASE_URL && !process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL or TURSO_DATABASE_URL environment variable");
}
```
Enforce that the environment variable is always set; do not silently fall back to a local file in production.

**Risk if not fixed:** **HIGH** — silent runtime failures when env vars are misconfigured, very hard to debug.

---

## Summary Table

| # | Finding | File | Risk |
|---|---------|------|------|
| 1 | Silent `.catch(() => {})` hides all errors | `app/(dashboard)/admin/page.tsx` | HIGH |
| 2 | Sequential queries — no `Promise.all` or caching | `app/(dashboard)/admin/page.tsx` | MEDIUM |
| 3 | Zero observability (no Sentry, no logging) | All | HIGH |
| 4 | Missing `connection_limit` in DATABASE_URL | `lib/prisma.ts` | MEDIUM |
| 5 | LibSQL adapter has no connection management | `lib/prisma.ts` | MEDIUM |
| 6 | Silent `file:./dev.db` fallback in production | `lib/prisma.ts` | HIGH |

---

## Recommended Priority Order

1. **Immediate:** Fix #6 (enforce env var) and #1 (add error logging)
2. **Short term:** Add Sentry (#3) and parallelize queries (#2)
3. **Medium term:** Tune connection pools (#4, #5) and add caching (#2)
