## 2026-06-25 - Bulk Insert Optimization with Prisma
**Learning:** Using a loop with `prisma.model.create()` for inserting multiple related records creates an N+1 query problem, leading to significant performance degradation.
**Action:** Replace `create` in a loop with a single `prisma.model.createMany()` call by mapping the input array to the correct data shape. This reduced execution time by over 12x (e.g., from 680ms to 50ms for 100 records).

## 2023-11-06 - Prisma Cascade Deletion Optimization
**Learning:** Sequential `deleteMany` calls in a loop cause severe N+1 performance degradation when cascading deletes for relational data (e.g., deleting modules and their nested quizzes, questions, and materials).
**Action:** Always extract relation IDs into an array and perform a single `deleteMany` using the `{ in: ids }` operator, ensuring the array is not empty before querying.
