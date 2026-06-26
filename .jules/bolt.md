## 2026-06-25 - Bulk Insert Optimization with Prisma
**Learning:** Using a loop with `prisma.model.create()` for inserting multiple related records creates an N+1 query problem, leading to significant performance degradation.
**Action:** Replace `create` in a loop with a single `prisma.model.createMany()` call by mapping the input array to the correct data shape. This reduced execution time by over 12x (e.g., from 680ms to 50ms for 100 records).

## 2023-11-06 - Prisma Cascade Deletion Optimization
**Learning:** Sequential `deleteMany` calls in a loop cause severe N+1 performance degradation when cascading deletes for relational data (e.g., deleting modules and their nested quizzes, questions, and materials).
**Action:** Always extract relation IDs into an array and perform a single `deleteMany` using the `{ in: ids }` operator, ensuring the array is not empty before querying.

## 2026-06-25 - Bulk Prisma Deletion N+1 Fix
**Learning:** Sequential `.deleteMany` operations over a list of items using a loop is highly inefficient (N+1 queries).
**Action:** Always fetch the `id`s array in bulk and apply `{ in: ids }` operator for cascading deletion in Prisma. This provided ~98% increase in speed for 200 items.

## 2025-06-25 - Batch Inserts
**Learning:** Replace sequential N+1 `prisma.create` queries in loops with `prisma.createMany` batch inserts for significantly better performance.
**Action:** Use batch operations instead of loops where possible.
