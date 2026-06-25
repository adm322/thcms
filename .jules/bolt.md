## 2024-10-24 - Parallelized Dashboard Sales Route Queries
**Learning:** The admin sales dashboard route (`app/api/admin/sales/route.ts`) previously executed sequential `findMany` queries for invoices and bookings, creating an unnecessary N+1 style bottleneck.
**Action:** When working in API routes that fetch aggregate data for dashboards, proactively look for independent Prisma queries that can be grouped and executed concurrently using `Promise.all` to reduce overall latency.
