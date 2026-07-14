# 🗄️ DBA Audit — TrainHub Schema Indexes & Query Optimization

## 1. Missing Composite Index: `Booking (status, programDate)`

**Severity: HIGH**

Used heavily in `getAdminCalendar` (lines 42–61, 91–99):
```ts
where: {
  programDate: { gte: ..., lt: ... },
  status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
}
```
Also used in `getAdminCalendar` upcoming query:
```ts
where: {
  programDate: { gte: now },
  status: { in: ["CONFIRMED", "PENDING"] },
}
```

Individual indexes exist (`@@index([status])`, `@@index([programId])`), but SQLite can't use them together for range + equality. As the bookings table grows, this will do full index scans.

**Fix:**
```prisma
model Booking {
  ...
  @@index([status, programDate])
}
```

---

## 2. Missing Index: `Booking.employerHrdfSubmitted`

**Severity: HIGH**

Used in `getAdminActions` (line 270):
```ts
where: { status: "COMPLETED", employerHrdfSubmitted: false }
```

No index on `employerHrdfSubmitted`. In production with thousands of completed bookings, this is a table scan.

**Fix:**
```prisma
model Booking {
  ...
  @@index([employerHrdfSubmitted])
}
```

---

## 3. Missing Index: `Reimbursement.status`

**Severity: MEDIUM**

`getAdminStats` runs:
```ts
await prisma.reimbursement.count({ where: { status: "PENDING" } });
```
And `getAdminActions` also fetches this count. No index on `status` — table scan.

**Fix:**
```prisma
model Reimbursement {
  ...
  @@index([status])
}
```

---

## 4. Missing Index: `Invoice.status`

**Severity: MEDIUM**

`getAdminStats` fetches all SENT/PAID invoices just to sum amounts:
```ts
where: { status: { in: ["PAID", "SENT"] } },
select: { amount: true },
```
No index on `status`. With thousands of invoices, this is a table scan.

**Fix:**
```prisma
model Invoice {
  ...
  @@index([status])
}
```

---

## 5. Suboptimal Aggregate: `getAdminTrainingPlans` — load full booking rows to compute total

**Severity: MEDIUM**

`getAdminTrainingPlans` (line 183–192):
```ts
bookings: {
  where: {
    programDate: { gte: ..., lt: ... },
    status: { not: "CANCELLED" },
  },
  select: { totalFee: true, programDate: true, status: true }, // <-- still loads full rows
},
```
Then in JS:
```ts
const totalSpent = company.bookings.reduce((s, b) => s + b.totalFee, 0);
```

With 50 companies × 20 bookings each = 1,000 rows loaded just to add up numbers. Should use Prisma's `_sum` aggregate instead.

**Fix:**
```ts
const companies = await prisma.company.findMany({
  where: companyId ? { id: companyId } : {},
  include: {
    trainingPlans: { where: { targetYear: year }, ... },
    _count: { select: { employees: true } },
  },
});

// Separate aggregation query
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

---

## 6. Missing Index: `Attendance (employeeId, date)`

**Severity: LOW**

`Attendance` has separate indexes on `employeeId` and `date`, but common queries filter by both:
```ts
where: { employeeId: someId, date: { gte: start, lte: end } }
```

SQLite will pick one index but can't efficiently handle both columns' filters without a composite.

**Fix:**
```prisma
model Attendance {
  ...
  @@index([employeeId, date])
}
```

---

## 7. Missing Index: `Employee (companyId, status)`

**Severity: LOW**

HR frequently queries active/inactive employees per company. No composite.

**Fix:**
```prisma
model Employee {
  ...
  @@index([companyId, status])
}
```

---

## 8. Missing Index: `Notification (userId, read)`

**Severity: LOW**

Used for "unread notification count" and "unread notifications list":
```ts
where: { userId: someId, read: false }
```

Separate indexes exist; a composite would be more efficient.

**Fix:**
```prisma
model Notification {
  ...
  @@index([userId, read])
}
```

---

## Summary Table

| # | Table | Missing Index | Columns | Impact |
|---|---|---|---|---|
| 1 | Booking | Composite | `(status, programDate)` | HIGH — calendar queries |
| 2 | Booking | Single | `employerHrdfSubmitted` | HIGH — HRDF followup query |
| 3 | Reimbursement | Single | `status` | MEDIUM — count queries |
| 4 | Invoice | Single | `status` | MEDIUM — revenue aggregation |
| 5 | Booking | Aggregate | `_sum` instead of row load | MEDIUM — training plan query |
| 6 | Attendance | Composite | `(employeeId, date)` | LOW — attendance lookups |
| 7 | Employee | Composite | `(companyId, status)` | LOW — HR employee lists |
| 8 | Notification | Composite | `(userId, read)` | LOW — unread counts |

---

## Migration Steps

```bash
# Generate a new migration
npx prisma migrate dev --name add_dba_audit_indexes
```

The Prisma schema changes needed:
1. Add `@@index([status, programDate])` to `Booking`
2. Add `@@index([employerHrdfSubmitted])` to `Booking`
3. Add `@@index([status])` to `Reimbursement`
4. Add `@@index([status])` to `Invoice`
5. Add `@@index([employeeId, date])` to `Attendance`
6. Add `@@index([companyId, status])` to `Employee`
7. Add `@@index([userId, read])` to `Notification`

For #5, refactor `getAdminTrainingPlans` to use `_sum` aggregation instead of loading rows.

---

*DBA Audit by Mavis — 2026-06-28*
