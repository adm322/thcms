# Backend: Query Pattern Audit — admin.service.ts

**Auditor:** Backend Agent  
**Date:** 2026-06-28  
**Files analyzed:**
- `lib/services/admin.service.ts`
- `app/(dashboard)/admin/page.tsx`
- `lib/prisma.ts`
- `prisma/schema.prisma`

---

## Summary of Findings

| # | Finding | Impact | Location |
|---|---------|--------|----------|
| 1 | `getAdminActions`: missing `take` on `pendingBookings` — loads all rows | HIGH | admin.service.ts:263 |
| 2 | Page-level sequential awaits are unnecessary — no connection spike risk | MEDIUM | page.tsx:17–21 |
| 3 | `getAdminCalendar`: 3 redundant booking queries with large overlaps | MEDIUM | admin.service.ts:42–99 |
| 4 | `getAdminTrainingPlans`: no index on `(companyId, targetYear)` — full scan per company | MEDIUM | schema.prisma |
| 5 | `getAdminCalendar`: no index on `(programDate, status)` — full table scan | MEDIUM | schema.prisma |
| 6 | `getAdminStats`: 6 sequential queries could be parallelized | LOW | admin.service.ts:3–14 |
| 7 | `getAdminChangelog`: no `take` on changelog query | LOW | admin.service.ts:156 |
| 8 | `getAdminStats` revenue: JS `reduce()` vs DB — acceptable for SQLite | LOW | admin.service.ts:10–14 |

---

## Finding 1 — HIGH: `getAdminActions` missing `take` on pendingBookings

**Location:** `admin.service.ts:263–267`

### Problem

```typescript
// BEFORE — loads ALL pending bookings every time
const pendingBookings = await prisma.booking.findMany({
  where: { status: "PENDING" },
  include: { program: { select: { title: true } } },
  orderBy: { createdAt: "desc" },
  // ← no take! pulls every row from the table
});
```

The code only ever uses `pendingBookings.slice(0, 5)` (line 280). In production with many pending bookings, this loads the entire result set into Node.js memory just to discard 99%.

### Impact

If there are 1,000 pending bookings, you're transferring ~50 KB of unnecessary data per page load. Scales badly.

### Fix

```typescript
// AFTER
const pendingBookings = await prisma.booking.findMany({
  where: { status: "PENDING" },
  include: { program: { select: { title: true } } },
  orderBy: { createdAt: "desc" },
  take: 5,  // ← only fetch what you actually use
});
```

Also consider adding `select: { id: true, createdAt: true, program: { select: { title: true } } }` instead of `include`, since `include` still loads the entire Booking record (with all scalars). But since you only read `id`, `createdAt`, and `program.title`, switching to `select` gives a meaningful reduction:

```typescript
// BEST — minimal select, no include
const pendingBookings = await prisma.booking.findMany({
  where: { status: "PENDING" },
  select: {
    id: true,
    createdAt: true,
    program: { select: { title: true } },
  },
  orderBy: { createdAt: "desc" },
  take: 5,
});
```

---

## Finding 2 — MEDIUM: Page-level sequential awaits are unnecessary

**Location:** `page.tsx:17–21`

### Problem

```typescript
// BEFORE — sequential, one after another
const stats = await getAdminStats()...;
const calData = await getAdminCalendar()...;
const changelog = await getAdminChangelog()...;
const planData = await getAdminTrainingPlans(currentYear)...;
const actData = await getAdminActions()...;
```

The comment says: _"execute queries sequentially to prevent database connection spikes since we don't have PgBouncer running on this specific cluster."_

### Why this is outdated

Looking at `prisma.ts`:
- **SQLite (dev/default):** LibSQL has no connection pooling concerns.
- **PostgreSQL (InsForge prod):** The pool is configured with `max: 10`. With 5 queries in sequence, at most 1 connection is used at a time — that's not a spike, that's undersubscription.
- Sequential execution here means total wall-clock time = sum of all query times. Parallel execution means total wall-clock time = time of the slowest query.

With 5 queries each taking ~50 ms, sequential = **250 ms**, parallel = **50 ms**.

### Fix

```typescript
// AFTER — parallel, same connection pool budget
const [stats, calData, changelog, planData, actData] = await Promise.all([
  getAdminStats().catch(() => ({...})),
  getAdminCalendar().catch(() => ({...})),
  getAdminChangelog().catch(() => []),
  getAdminTrainingPlans(currentYear).catch(() => ({...})),
  getAdminActions().catch(() => ({...})),
]);
```

This is safe because each function uses `prisma` independently (no cross-query dependencies), and each is independently wrapped in `.catch()`.

---

## Finding 3 — MEDIUM: `getAdminCalendar` — 3 overlapping booking queries

**Location:** `admin.service.ts:42–112`

### Problem

Three separate `prisma.booking.findMany` calls, all scanning the same table:

| Query | Filters | Used for |
|-------|---------|----------|
| Q1 (line 42) | `dateFilter` + `status IN [...]` | `bookings[]` (full mapped result) |
| Q2 (line 64) | `programDate >= now` + `status IN [...]`, `take:15` | `upcoming[]` |
| Q3 (line 91) | `monthStart..monthEnd` + `status IN [...]` | `monthlyStats` aggregation |

**Q1 and Q2 overlap significantly.** If today is in the target month, Q2's results are almost entirely a subset of Q1's results (just limited to `programDate >= now`).

**Q3 overlaps with Q1** if a month filter is applied — it's the same date range with fewer fields selected.

### Fix

Consolidate into 2 queries (or 1 with a slight tweak):

```typescript
// AFTER — one main query, derive the rest in JS

const now = new Date();
const monthStart = month
  ? new Date(Number(month.split("-")[0]), Number(month.split("-")[1]) - 1, 1)
  : new Date(now.getFullYear(), now.getMonth(), 1);
const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

// Build a single date range that covers ALL three queries
const allBookings = await prisma.booking.findMany({
  where: {
    // Cover both "upcoming" and "month filter" date ranges
    programDate: month
      ? { gte: monthStart, lte: monthEnd }  // use month if provided, else all future
      : { gte: new Date(0) },                // no date filter if neither provided
    status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
  },
  include: {
    program: {
      select: {
        title: true, category: true, locationType: true, durationHours: true,
        trainer: { select: { id: true, name: true, email: true } },
      },
    },
    company: { select: { name: true, address: true, state: true } },
    _count: { select: { participants: true } },
  },
  orderBy: { programDate: "asc" },
});

// Derive bookings list (respects month filter from query)
const bookings = month
  ? allBookings  // already filtered by month
  : allBookings; // if no month, you could skip — depends on UX requirement

// Derive upcoming (upcoming from today, regardless of month)
const upcoming = allBookings
  .filter(b => b.programDate >= now && ["CONFIRMED", "PENDING"].includes(b.status))
  .slice(0, 15);

// Derive monthly stats
const monthlyStats = {
  totalTrainings: allBookings.length,
  totalHours: allBookings.reduce((s, b) => s + b.program.durationHours, 0),
  completedCount: allBookings.filter(b => b.status === "COMPLETED").length,
  confirmedCount: allBookings.filter(b => b.status === "CONFIRMED").length,
  pendingCount: allBookings.filter(b => b.status === "PENDING").length,
  byCategory: allBookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.program.category] = (acc[b.program.category] || 0) + 1;
    return acc;
  }, {}),
};
```

**Caveat:** If the admin can query a wide date range (many years of data), a single query could return thousands of rows. In that case, keep Q1 + Q3 and drop Q2 (upcoming) as it's the least selective. Or use Q1 + Q2 and compute monthly stats from Q1's result in JS (Q1 already has the month filter applied).

---

## Finding 4 — MEDIUM: Missing index `(companyId, targetYear)` for training plan queries

**Location:** `prisma/schema.prisma` (TrainingPlanItem model)

### Problem

`getAdminTrainingPlans` (admin.service.ts:168–169) queries:
```typescript
where: { targetYear: year },
```

The parent query is `prisma.company.findMany({ where: companyId ? { id: companyId } : {} })`, so for each company (or the single target company), this filters `TrainingPlanItem` by `targetYear`. Without a composite index on `(companyId, targetYear)`, Prisma will either:

- Scan the `TrainingPlanItem` table filtered only by `targetYear` (if using the `targetYear` index), then filter by `companyId` in memory, OR
- Scan all rows for the company and filter by `targetYear` in memory.

Neither is ideal.

### Fix

```prisma
// prisma/schema.prisma — TrainingPlanItem model, add after existing indexes
@@index([companyId, targetYear])  // composite index for training plan queries
```

This supports the `WHERE companyId = ? AND targetYear = ?` pattern efficiently.

---

## Finding 5 — MEDIUM: Missing index `(programDate, status)` for calendar queries

**Location:** `prisma/schema.prisma` (Booking model)

### Problem

`getAdminCalendar` queries `booking` filtered by `programDate` range + `status IN [...]`. Neither existing index (`status` alone, `programDate` alone) optimally covers the combined filter. A composite index helps:

```typescript
// Used in queries like:
where: {
  programDate: { gte: ..., lt: ... },
  status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
}
```

### Fix

```prisma
// prisma/schema.prisma — Booking model, add after existing indexes
@@index([programDate, status])  // composite index for calendar & date-range queries
```

Note: SQLite (used in dev) doesn't have index skip-scan issues like MySQL does, but this composite index still helps the query planner use a range scan on `programDate` while also filtering by status via the index.

---

## Finding 6 — LOW: `getAdminStats` 6 sequential queries

**Location:** `admin.service.ts:3–14`

### Problem

```typescript
const totalBookings = await prisma.booking.count();           // Q1
const totalTrainers = await prisma.user.count({...});        // Q2
const totalPrograms = await prisma.program.count({...});      // Q3
const pendingBookings = await prisma.booking.count({...});    // Q4
const pendingReimbursements = await prisma.reimbursement.count({...}); // Q5
const invoices = await prisma.invoice.findMany({...});        // Q6
```

Six sequential awaits. These are all independent and fast (`COUNT(*)` is cheap), but they add latency linearly.

### Fix

```typescript
// AFTER — parallel
const [totalBookings, totalTrainers, totalPrograms, pendingBookings, pendingReimbursements, invoices] =
  await Promise.all([
    prisma.booking.count(),
    prisma.user.count({ where: { role: "TRAINER" } }),
    prisma.program.count({ where: { status: "PUBLISHED" } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.reimbursement.count({ where: { status: "PENDING" } }),
    prisma.invoice.findMany({ where: { status: { in: ["PAID", "SENT"] } }, select: { amount: true } }),
  ]);
```

**Trade-off:** Minimal for small datasets, but good practice. The total latency drops from sum(Q1..Q6) to max(Q1..Q6).

---

## Finding 7 — LOW: `getAdminChangelog` has no `take`

**Location:** `admin.service.ts:156–160`

```typescript
const entries = await prisma.changelog.findMany({
  include: { author: { select: { name: true } } },
  orderBy: { createdAt: "desc" },
  // take: 20,  ← declared in the page but not enforced at DB level
  take: 20,     // ← add this
});
```

The page hard-codes `take: 20` in the description, but the DB layer doesn't enforce it. If the data grows or the caller changes, this could return unbounded results.

---

## Finding 8 — LOW: Revenue calculation in JS — acceptable

**Location:** `admin.service.ts:10–14`

```typescript
const invoices = await prisma.invoice.findMany({
  where: { status: { in: ["PAID", "SENT"] } },
  select: { amount: true },
});
const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
```

### Assessment

**No change needed.** SQLite does not support `SUM()` in queries without raw SQL (and raw SQL breaks the Prisma abstraction + PrismaPg adapter path). The current approach is correct. The `select: { amount: true }` already minimizes data transfer (only the `amount` Float is fetched).

If you migrate to PostgreSQL, this could become:
```typescript
// PostgreSQL only (not for SQLite)
const result = await prisma.$queryRaw<[{ total: number }]>`
  SELECT COALESCE(SUM(amount), 0) as total
  FROM "Invoice"
  WHERE status IN ('PAID', 'SENT')
`;
const totalRevenue = Number(result[0].total);
```

But keep the JS approach for now — it's safe, readable, and the invoice table is unlikely to be large enough to matter.

---

## Bonus: Other Observations

### `getAdminTrainingPlans` — over-fetching concern is unfounded

The nested include in `getAdminTrainingPlans` (lines 168–179) uses `select` at every level to pull only 3–4 fields from booking/program/trainer. This is well-structured. The concern about "over-fetching" does not apply here.

### `getAdminChangelog` author include is efficient

`include: { author: { select: { name: true } } }` — correctly uses `select` to avoid loading entire User records. Good pattern.

### Page-level `.catch()` is defensive but noisy

The `catch(() => ({...}))` on every service call handles service failures gracefully. However, it silently swallows errors, making debugging harder. Consider:
- A single top-level error boundary in the React component instead
- Or at minimum, logging in dev: `catch((e) => { console.error(e); return {...}; })`

---

## Recommendations Priority

| Priority | Action | Files to change |
|----------|--------|-----------------|
| **1 — Do now** | Add `take: 5` to `pendingBookings` in `getAdminActions` | admin.service.ts:263 |
| **2 — Do now** | Parallelize page-level awaits in admin/page.tsx | page.tsx:17–21 |
| **3 — Add to migration** | Add composite index `@@index([companyId, targetYear])` on TrainingPlanItem | schema.prisma |
| **4 — Add to migration** | Add composite index `@@index([programDate, status])` on Booking | schema.prisma |
| **5 — Low effort** | Parallelize `getAdminStats` queries | admin.service.ts:3–14 |
| **6 — Low effort** | Add `take: 20` to `getAdminChangelog` | admin.service.ts:156 |
| **7 — Nice to have** | Consolidate `getAdminCalendar` to 2 queries | admin.service.ts:26–152 |
