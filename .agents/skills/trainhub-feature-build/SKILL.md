---
name: trainhub-feature-build
description: |
  Full-stack feature build pattern for TrainHub (Next.js 16 + Prisma + SQLite).
  Use whenever the user wants to add a new page, feature, or data model — even if they don't say "full stack."
  Covers: Prisma schema → API endpoints (CRUD + summary) → page with tabs/modals/skeletons → seed data → build & verify.
  Also use for "rework this feature" or "redesign this page" requests.
---

# TrainHub Full-Stack Feature Build

When building or reworking a feature in TrainHub, follow this exact sequence. Every step exists because we learned the hard way — skipping one causes cascading errors.

## 1. Add the Prisma Model

Read `prisma/schema.prisma` first (never write blind). Place the new model before the `// ─── Trainer Availability` marker. Keep fields minimal — only what the feature actually needs.

Must include:
- `id String @id @default(cuid())`
- `companyId String` + `company Company @relation(...)` (if company-scoped)
- `createdAt DateTime @default(now())` + `updatedAt DateTime @updatedAt`
- Proper `@@index` on query fields

Add reverse relations on the parent models (User, Company, Booking, etc.) immediately after.

Then run `npx prisma generate` to update the generated client. Run `npx prisma db push --accept-data-loss` to create the table.

## 2. Create API Endpoints

Always create these files:

### `app/api/{role}/{feature}/route.ts`
- `GET` — list with query params (year, status, department, month). Include related data (booking, program, etc.). Serialize all dates with `.toISOString()`.
- `POST` — create with validation. Require `title`, `category`, and any non-nullable fields. Use `body = await request.json().catch(() => null)` pattern. Return 201.

### `app/api/{role}/{feature}/[id]/route.ts`
- `PATCH` — verify ownership (match `companyId` from session). Use `data: any = {}` pattern, only set fields if `!== undefined`. Validate linked IDs (booking, program) exist and belong to same company.
- `DELETE` — verify ownership first, then delete.

### `app/api/{role}/{feature}/summary/route.ts` (if dashboards need aggregated data)
- Return computed stats: totals, by-month, by-department, by-status breakdowns.

**Auth pattern:** Always check `session.role` and `session.companyId` (for HR) or `session.id` (for trainer). Return 401.

**Note:** The Booking model doesn't have `trainerId` — use `program: { trainerId: session.id }` to query.

## 3. Build the Page

Create `app/(dashboard)/{role}/{feature}/page.tsx`. Always:

- `"use client"` at top
- Import existing components: `CollapsibleSection`, `NextActionBanner`, `Skeleton`, `Badge`, `Button`, `Tabs`, `Input`, `Card`
- Define TypeScript interfaces for all data shapes
- Use `useState` for data arrays, loading, modals, selections
- Use `useCallback` + `useEffect` for data fetching
- Include a `Skeleton` component for loading state
- Use `useToast()` for success/error feedback
- Handle empty states (show "No items" messages with links to create)

For calendar/grid views, define color constants (`CATEGORY_COLORS`, `CATEGORY_DOT`, `PRIORITY_COLORS`).

For pipeline/kanban views, define status constants with labels and tooltips.

Modals should use `fixed inset-0 z-50` overlay with `stopPropagation()` on the inner card.

## 4. Add Seed Data

Open `prisma/seed.ts`. First add `await prisma.{model}.deleteMany()` in the cleanup section (before the parent model's deleteMany to avoid FK errors).

**Data Integrity:** Never ignore partial seed script failures. If a script fails halfway through, you MUST delete the corrupted partial data and fix the script so it runs cleanly from start to finish.

Add realistic data after all existing seed sections, before the `console.log("✅ Seed complete!")` line. Use arrays of objects and iterate with `for...of`.

Update the console.log summary to mention the new data count.

## 5. Build & Verify Full Lifecycle

```bash
# Kill server first (SQLite locks)
powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force"

# Build
npx next build --webpack    # Windows: always use --webpack

# Start
npx next start -p 3000
```

After starting the server, you **MUST verify the complete app lifecycle**:
- **Verify UI Connections:** If you added a link, button, or redirect, guarantee the target route exists and successfully resolves (no dead ends).
- **Verify Seeded Data:** Do not assume the seed script worked just because the UI renders. Verify that the seeded data is actually consumable by the application (e.g., checking that a seeded Quiz actually loads its questions).

If build fails with TypeScript errors:
- Check `BookingWhereInput` doesn't support `trainerId` — use `{ program: { trainerId } }`
- Check `SessionUser` has `id` not `userId`
- Lucide icons don't accept `title` prop
- Use `?.toISOString() || null` for optional dates
- Don't use `CardContent` without a wrapping `Card`

## Anti-Patterns to Avoid

- Don't use Turbopack on Windows (crashes on `nul` device)
- Don't restart server without killing it first (port conflict)
- Don't run seed without deleting DB first if FK constraints may exist
- Don't use `userId` on session (it's `id`)
- Don't put `trainerId` directly on Booking queries
- Don't nest `CollapsibleSection` inside another `CollapsibleSection`
- **Don't create dead ends:** Never leave a UI link or user flow pointing to a broken, unverified, or unimplemented route. Ensure the complete app lifecycle is finished.
- **Don't tolerate partial data:** Never leave partially seeded or corrupted database records.
