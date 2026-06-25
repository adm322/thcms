## 2026-06-25 - Bulk Prisma Deletion N+1 Fix
**Learning:** Sequential `.deleteMany` operations over a list of items using a loop is highly inefficient (N+1 queries).
**Action:** Always fetch the `id`s array in bulk and apply `{ in: ids }` operator for cascading deletion in Prisma. This provided ~98% increase in speed for 200 items.
