## 2025-01-20 - [Performance] Prisma Batch Updates for Calculated Fields
**Learning:** When needing to conditionally update many records with calculated values that require individual processing, making sequential `prisma.update()` calls creates an N+1 query bottleneck.
**Action:** Always collect these promises into an array (`updates.push(prisma.update(...))`) and execute them atomically using `await prisma.$transaction(updates)` to significantly reduce database round-trips and processing time.
