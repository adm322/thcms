## 2023-11-06 - Prisma Cascade Deletion Optimization
**Learning:** Sequential `deleteMany` calls in a loop cause severe N+1 performance degradation when cascading deletes for relational data (e.g., deleting modules and their nested quizzes, questions, and materials).
**Action:** Always extract relation IDs into an array and perform a single `deleteMany` using the `{ in: ids }` operator, ensuring the array is not empty before querying.
