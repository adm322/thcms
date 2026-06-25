## 2025-06-25 - Batch Inserts

**Learning:** Replace sequential N+1 `prisma.create` queries in loops with `prisma.createMany` batch inserts for significantly better performance.
**Action:** Use batch operations instead of loops where possible.
