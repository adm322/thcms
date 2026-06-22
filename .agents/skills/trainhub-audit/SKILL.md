---
name: trainhub-audit
description: |
  Systematic bug audit for TrainHub features after changes.
  Use when the user says "check for bugs", "did you check other pages", "audit", "verify everything works", "make sure logic is correct", or "I might overlook something".
  Performs: API validation checks → page state management checks → data flow verification → TypeScript compilation check → runtime verification.
---

# TrainHub Bug Audit

After making changes to TrainHub, audit ALL affected files — not just the ones you touched. Changes ripple through the shared Prisma schema, components, and APIs.

## Audit Sequence

Run these checks in order. Each level catches things the previous couldn't.

### Level 1: TypeScript Compilation

```bash
npx tsc --noEmit
```

Zero output means zero errors. If errors exist, fix the FIRST one — later errors are often cascading.

### Level 2: API Endpoint Audit

For each new or modified API route, verify:

- **Auth:** `session.role` check matches the endpoint prefix
- **Ownership:** For HR, verify `companyId` matches (for admin, companyId is irrelevant)
- **Input validation:** JSON parse with `.catch(() => null)`, required fields checked
- **Date serialization:** All `DateTime` fields use `.toISOString()` in responses
- **Optional dates:** Use `?.toISOString() || null` pattern
- **Error responses:** Proper status codes (400 bad request, 401 unauthorized, 404 not found)
- **Include/select:** Only fetch fields the frontend needs

### Level 3: Page State Management Audit

For each page component, check:

- **State bleed:** Shared state (like note inputs) must clear when switching between items. Use `setNoteItemId(newId); setAdminNote("")` together.
- **Lost state on data refresh:** Year/period changes that trigger `fetchData()` shouldn't collapse expanded sections. Use separate `initialLoad` flag.
- **Loading states:** Skeleton shown only on initial load, not on every data refresh
- **Modal cleanup:** Close modals by setting state to `null`/`false` (not removing from DOM)
- **Optimistic updates:** Status changes should call `fetchData()` after API success, not before
- **Empty states:** Every list should handle `length === 0` with a friendly message

### Level 4: Data Flow Verification

Trace the full lifecycle of the feature's data:

```
User action → API call → Prisma query → response serialization → state update → re-render
```

Check:
- Can a user create an item? Does it appear in the list?
- Can they transition it through all statuses? Are transitions guarded?
- Can they delete it? Does it cascade properly?
- Does the linked data (booking, program) reference exist and belong to the same company?
- Does the admin view show the item? Can admin interact appropriately?

### Level 5: Cross-Page Impact

For Prisma schema changes, check every page that uses the changed model:

- New fields on Booking → check admin bookings page, HR bookings page, booking detail pages
- New model → check if any existing delete operations need the new model added to cleanup order
- New relation on User/Company → verify those models still create/delete cleanly in seed

### Level 6: Sidebar & Navigation

- New admin pages → add to `adminNav` array in `components/Sidebar.tsx`
- New HR pages → add to `hrNav` array
- Icon imports in Sidebar must include the new icon

### Level 7: Runtime Verification

After build and server start:
```bash
curl -s -o NUL -w "%{http_code}" http://localhost:3000/login        # expect 200
curl -s -o NUL -w "%{http_code}" http://localhost:3000/{new-page}    # expect 307 (auth redirect = page exists)
```

## Common Bugs Found Pattern

| Symptom | Root Cause |
|---------|-----------|
| FK constraint on seed | Missing `deleteMany` in cleanup for new model |
| "Property does not exist" TS error | `session.userId` should be `session.id` |
| "trainerId not in BookingWhereInput" | Use `{ program: { trainerId } }` instead |
| JSX "Unexpected token" error | Unclosed tag or `CardContent` without wrapping `Card` |
| Page not found after build | Server running old build — kill and restart |
| Table doesn't exist | `prisma db push` not run after schema change |
| Notes bleeding between items | State not cleared when target changes |
| Expanded state lost | `setLoading(true)` triggers skeleton, resetting UI state |
