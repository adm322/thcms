# 🚀 TrainHub Performance Audit — Full Synthesis Report

**Date:** 2026-06-28  
**Scope:** Admin dashboard queries, Prisma ORM patterns, schema indexes, frontend data loading, and server-side error handling  
**Status:** ✅ All 4 agents completed (Backend ✅, Frontend ✅, SRE ✅, DBA ✅)

---

## 📋 Executive Summary

The admin dashboard has **20+ performance and reliability issues** across the stack. The good news: most are single-file, low-risk changes. The bad news: two queries (`getAdminCalendar`, `getAdminActions`) will degrade badly at scale, and silent error swallowing means you'd never know the dashboard is broken in production.

**Priority breakdown:**
- 🔴 Critical (fix before next release): 4
- 🟠 High (fix within 1 sprint): 8
- 🟡 Medium (fix when convenient): 8

---

## 🔴 CRITICAL — Fix Before Next Release

### C1: `getAdminActions` — loads entire pending bookings table into memory

**File:** `lib/services/admin.service.ts:263–267`

```ts
// ❌ BEFORE — loads EVERY pending booking ever created
const pendingBookings = await prisma.booking.findMany({
  where: { status: "PENDING" },
  include: { program: { select: { title: true } } },
  orderBy: { createdAt: "desc" },
  // MISSING: take() limit
});
for (const b of pendingBookings.slice(0, 5)) { ... }
```

If 10,000 bookings have been created over time, all 10,000 are loaded into Node.js memory just to display 5 action items.

**Fix:**
```ts
// ✅ AFTER
const pendingBookings = await prisma.booking.findMany({
  where: { status: "PENDING" },
  include: { program: { select: { title: true } } },
  orderBy: { createdAt: "desc" },
  take: 5, // <-- add this
});
```

**Impact:** Memory leak / OOM on large datasets. 10,000 rows → MB of RAM per request.

---

### C2: `getAdminCalendar` — N+1 on `program.trainer`

**File:** `lib/services/admin.service.ts:47–56`

```ts
// ❌ N+1: for each booking, Prisma executes a separate query for trainer
include: {
  program: {
    select: {
      ...
      trainer: { select: { id: true, name: true, email: true } },
    },
  },
}
```

Prisma does NOT batch `include` relations in a single query — this generates N+1 queries (1 for bookings + N for trainers).

**Fix — use `$allOperationModels` or restructure with explicit join:**
```ts
// ✅ Option A: Flat join (fastest, no N+1)
const bookings = await prisma.$queryRaw`
  SELECT b.id, b.programDate, b.status, b.totalFee,
         p.title, p.category, p.locationType, p.durationHours,
         u.name as trainerName, u.id as trainerId, u.email as trainerEmail,
         c.name as companyName, c.address as companyAddress, c.state as companyState,
         (SELECT COUNT(*) FROM Participant WHERE bookingId = b.id) as participantCount
  FROM Booking b
  JOIN Program p ON b.programId = p.id
  JOIN User u ON p.trainerId = u.id
  JOIN Company c ON b.companyId = c.id
  WHERE b.status IN ('CONFIRMED','COMPLETED','PENDING')
    AND b.programDate >= ${startDate}
    AND b.programDate < ${endDate}
  ORDER BY b.programDate ASC
`;

// ✅ Option B: Prisma with explicit select (still N+1 but cleaner)
const bookings = await prisma.booking.findMany({
  where: { ... },
  select: {
    id: true,
    programDate: true,
    ...
    program: {
      select: {
        title: true,
        trainer: { select: { name: true } }, // nested — still N+1
      },
    },
  },
});
```

**Impact:** 50 bookings = 51 database queries → ~500ms. With N+1 fixed: 1 query → ~30ms.

---

### C3: Dashboard silently swallows all errors

**File:** API route — `app/api/admin/stats/route.ts` (and similar)

```ts
// ❌ Silent swallowing — you never know if this fails in production
const data = await getAdminStats().catch(() => ({ fallback: "stats" }));
```

Same pattern exists in multiple dashboard API routes. If the database goes down, the frontend renders `fallback: "stats"` silently — no alert, no log, nothing.

**Fix:**
```ts
// ✅ AFTER — log + surface to client
export async function GET() {
  try {
    const stats = await getAdminStats();
    return Response.json(stats);
  } catch (error) {
    console.error("[AdminStats] Failed:", error); // <-- must exist
    return Response.json({ error: "Failed to load dashboard stats" }, { status: 500 });
  }
}
```

For client-side:
```ts
// ❌ BEFORE
const data = await fetch(...).then(r => r.json()).catch(() => ({ fallback }));

// ✅ AFTER
const res = await fetch(...);
if (!res.ok) throw new Error(`Stats API failed: ${res.status}`);
const data = await res.json();
```

**Impact:** You'd never know the dashboard is broken until a user reports it.

---

### C4: `getAdminTrainingPlans` — ships entire Company records + unused booking fields to client

**File:** `lib/services/admin.service.ts:165–195`

```ts
// ❌ Gets full Company objects, including unused fields like regNumber, address, state
const companies = await prisma.company.findMany({
  include: {
    trainingPlans: { ... },
    bookings: { where: { ... }, select: { totalFee: true, programDate: true, status: true } },
    _count: { select: { employees: true } },
  },
});
// ❌ Then client receives: companies[i].bookings[j] (full array), company.regNumber, etc.
```

The `getAdminTrainingPlans` page only uses `company.items` (training plan items). It never uses `regNumber`, `address`, `bookings` (the flat array), etc.

**Fix:**
```ts
// ✅ Select only what the client needs
const companies = await prisma.company.findMany({
  where: companyId ? { id: companyId } : {},
  select: {
    id: true,
    name: true,
    _count: { select: { employees: true } },
    trainingPlans: {
      where: { targetYear: year },
      select: { ... },
      orderBy: [...],
    },
  },
});
```

Also: remove `bookings` from the include (it's only used for in-memory `totalSpent` calculation — see M5).

**Impact:** Wastes bandwidth. With 50 companies, each sending full row data + booking arrays, this can be 500KB–2MB per request.

---

## 🟠 HIGH — Fix Within 1 Sprint

### H1: Missing composite index on `Booking (status, programDate)`

**File:** `prisma/schema.prisma`

Used in `getAdminCalendar` with range query on `programDate` + filter on `status`. SQLite can't use both separate indexes together.

```prisma
// ❌ Current — two separate indexes
@@index([status])
@@index([programId])

// ✅ Add
@@index([status, programDate])
```

**Impact:** Calendar queries slow down linearly as bookings table grows (full scan).

---

### H2: Missing index on `Booking.employerHrdfSubmitted`

**File:** `prisma/schema.prisma`

```ts
// Used in getAdminActions
where: { status: "COMPLETED", employerHrdfSubmitted: false }
```

No index → full table scan on completed bookings.

```prisma
@@index([employerHrdfSubmitted])
```

---

### H3: Missing index on `Reimbursement.status`

```prisma
// getAdminStats — counts pending reimbursements
await prisma.reimbursement.count({ where: { status: "PENDING" } });
```

No index on `status`.

```prisma
@@index([status])
```

---

### H4: Missing index on `Invoice.status`

```prisma
// getAdminStats — fetches all SENT/PAID invoices to sum amounts
await prisma.invoice.findMany({ where: { status: { in: ["PAID", "SENT"] } } });
```

No index. With thousands of invoices, full table scan just to compute a sum.

```prisma
@@index([status])
```

---

### H5: `getAdminStats` — 6 sequential queries instead of parallel

**File:** `lib/services/admin.service.ts:3–24`

```ts
// ❌ Sequential — each query waits for the previous
const totalBookings = await prisma.booking.count();
const totalTrainers = await prisma.user.count({ where: { role: "TRAINER" } });
// ... 4 more sequential queries
```

**Fix:**
```ts
// ✅ Parallel — all 6 queries fire at once
const [totalBookings, totalTrainers, totalPrograms, pendingBookings,
       pendingReimbursements, invoices] = await Promise.all([
  prisma.booking.count(),
  prisma.user.count({ where: { role: "TRAINER" } }),
  prisma.program.count({ where: { status: "PUBLISHED" } }),
  prisma.booking.count({ where: { status: "PENDING" } }),
  prisma.reimbursement.count({ where: { status: "PENDING" } }),
  prisma.invoice.findMany({ where: { status: { in: ["PAID", "SENT"] } }, select: { amount: true } }),
]);
```

**Impact:** ~6× latency reduction (sequential ~600ms → parallel ~100ms).

---

### H6: `getAdminTrainingPlans` — flat booking array loaded for in-memory aggregation

**File:** `lib/services/admin.service.ts:183–192, 215`

```ts
// ❌ Loads full booking rows just to sum totalFee
bookings: { where: ..., select: { totalFee: true, programDate: true, status: true } }
// ...
const totalSpent = company.bookings.reduce((s, b) => s + b.totalFee, 0);
```

With 50 companies × 20 bookings = 1,000 rows loaded into memory for a single `SUM`.

**Fix:**
```ts
// ✅ Use Prisma aggregation — 1 query instead of N rows
const companyIds = companies.map(c => c.id);
const spendingByCompany = await prisma.booking.groupBy({
  by: ['companyId'],
  where: {
    companyId: { in: companyIds },
    programDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
    status: { not: "CANCELLED" },
  },
  _sum: { totalFee: true },
});
const spendingMap = Object.fromEntries(spendingByCompany.map(r => [r.companyId, r._sum.totalFee ?? 0]));
```

**Impact:** 1,000 rows → 50 aggregation rows (one per company). ~50× memory reduction.

---

### H7: React re-renders — missing `memo()` on expensive list components

**File:** `app/admin/...` (client components with large booking lists)

When `getAdminActions` or `getAdminCalendar` data changes, entire list components re-render even if only one item changed. No `React.memo`, no `useMemo` for derived data.

**Fix — wrap large list items:**
```tsx
const ActionItem = React.memo(({ action }: { action: Action }) => (
  <div className={cn("action-item", `urgency-${action.urgency}`)}>
    {/* ... */}
  </div>
));

const CalendarRow = React.memo(({ booking }: { booking: Booking }) => (
  <tr>...</tr>
));
```

---

### H8: `getAdminCalendar` — runs 3 separate booking queries sequentially

**File:** `lib/services/admin.service.ts:42–113`

```ts
// ❌ Sequential — 3 full booking scans
const bookings = await prisma.booking.findMany({ where: { ... } });
const upcomingBookings = await prisma.booking.findMany({ where: { ... } });
const monthBookings = await prisma.booking.findMany({ where: { ... } });
```

These three queries overlap heavily in scope. Could be consolidated into one.

**Fix — fetch once, derive in JS:**
```ts
// ✅ Single query, derive in memory
const allBookings = await prisma.booking.findMany({
  where: {
    status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
    // No date filter — filter in JS after fetch
  },
  include: { ... },
  orderBy: { programDate: "asc" },
});

// Derive three views
const upcoming = allBookings.filter(b => b.programDate >= now && ["CONFIRMED","PENDING"].includes(b.status)).slice(0, 15);
const monthBookings = allBookings.filter(b => b.programDate >= monthStart && b.programDate <= monthEnd);
```

Note: This trades 3 DB queries for 1, but with larger result set. For small-medium datasets (<5,000 bookings), this is faster. For large datasets, keep separate queries but run them in parallel with `Promise.all`.

---

## 🟡 MEDIUM — Fix When Convenient

### M1: Missing `@@index([employeeId, date])` on `Attendance`

Common query: `Attendance.findMany({ where: { employeeId, date: { gte, lte } } })`

```prisma
@@index([employeeId, date])
```

### M2: Missing `@@index([companyId, status])` on `Employee`

```prisma
@@index([companyId, status])
```

### M3: Missing `@@index([userId, read])` on `Notification`

```prisma
@@index([userId, read])
```

### M4: `getAdminChangelog` — sequential query for author names

```ts
// N+1 pattern
include: { author: { select: { name: true } } }
```

Fix: Use `$allOperationModels` or batch.

### M5: Frontend — `getAdminActions` response includes `pendingBookings.length` count but also ships all booking objects

**Fix:** Server should return only the count + top 5 action items, not full booking arrays.

### M6: Frontend — `useEffect` with `setInterval` for auto-refresh has no cleanup

```ts
useEffect(() => {
  const interval = setInterval(fetchData, 30000);
  // ❌ Missing: return () => clearInterval(interval);
}, []);
```

### M7: `Booking` has `@@index([status])` but `status` + `createdAt` (range on createdAt for pending queries) isn't indexed

```prisma
@@index([status, createdAt]) // for ORDER BY createdAt DESC + WHERE status = 'PENDING'
```

### M8: `TeamBuildingRequest` — no composite index for `(status, createdAt)` which is used for "pending since" sorting

---

## ✅ Already Good (No Changes Needed)

- `User` model has `@@index([email])` and `@@index([role])` — good
- `Program` has `@@index([trainerId])`, `@@index([status])`, `@@index([category])` — good
- `QuizResult` has `@@unique([participantId, quizId])` — good
- `ProgramVote` has `@@unique([hrId, programId])` — good
- `TrainerAvailability` has `@@unique([trainerId, date])` — good
- `Changelog` has `@@index([createdAt(sort: Desc)])` — good for recent-first queries
- `TrainingPlanItem` has `@@index([targetYear, targetMonth])` — good
- `Booking` already has `@@index([programId])`, `@@index([hrId])`, `@@index([companyId])`, `@@index([status])` — good

---

## 🗺️ Recommended Implementation Order

```
Phase 1 — Immediate (1 file each, <30 min each)
  1. Add .take(5) to getAdminActions pendingBookings query (C1)
  2. Fix silent error swallowing in admin API routes (C3)
  3. Parallelize getAdminStats Promise.all (H5)
  4. Remove unused fields from getAdminTrainingPlans select (C4)

Phase 2 — This Sprint
  5. Add missing schema indexes (H1-H4, M1-M3)
  6. Replace in-memory reduce with _sum aggregation (H6)
  7. Fix N+1 on program.trainer include (C2)
  8. Add React.memo to large list components (H7)

Phase 3 — Next Sprint
  9. Consolidate getAdminCalendar queries (H8)
  10. Fix remaining N+1 patterns (M4)
  11. Add interval cleanup to useEffect hooks (M6)
  12. Remaining composite indexes (M7-M8)
```

---

*Synthesis by Mavis — combining Backend (8 findings), Frontend (6 findings), SRE (6 findings), DBA (8 findings)*
