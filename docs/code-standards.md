# Code Standards — TrainHub Malaysia

## Key Technical Decisions

1. **Table-based calendar** — Switched from CSS grid to HTML `<table>` for reliable cross-browser calendar rendering
2. **Flexbox sidebar** — Sidebar is a flex child (not fixed) on desktop, preventing overlap; drawer pattern on mobile
3. **Cascade delete** — Program deletion cleans up bookings→participants→evaluations→invoices→modules→quizzes→questions in order
4. **JSON body validation** — All POST/PUT routes use try-catch on `request.json()` with proper 400 error responses
5. **SS01 font feature** — Geist font with `font-feature-settings: "ss01"` for geometric alternates
6. **Stacked shadows** — Cards use subtle stacked shadows (`0 1px/2px/8px`) instead of single heavy drop shadows
7. **Suspense boundaries** — Pages using `useSearchParams()` are wrapped in `<Suspense>` for Next.js 16 compliance
8. **JWT cookies** — HTTP-only session cookies with 7-day expiry, verified via `jose` library

## API Route Pattern

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // 1. Auth check
  const session = await getSession();
  if (!session || session.role !== "TRAINER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // 2. Parse body safely
  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  
  // 3. Validate required fields
  if (!body?.title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  
  // 4. Prisma operation
  const item = await prisma.model.create({ data: { ... } });
  
  // 5. Return
  return NextResponse.json(item, { status: 201 });
}
```

## Component Pattern

```typescript
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function MyComponent() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/something")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (data.length === 0) return <EmptyState />;
  
  return <div>{/* render data */}</div>;
}
```

## Styling Rules
- Use Tailwind utility classes exclusively (no custom CSS unless unavoidable)
- Dark mode: `@custom-variant dark (&:is(.dark *))` available but not active by default
- Colors reference CSS variables: `bg-card`, `text-foreground`, `border-border`, `bg-primary text-primary-foreground`
- Spacing: Tailwind scale — `p-4`, `gap-6`, `space-y-4`
- Responsive: `sm:`, `lg:` prefixes — mobile-first

## Naming Conventions
- Files: `kebab-case.tsx` for components, `route.ts` for API handlers
- Components: PascalCase (`DashboardNavbar`, `UpcomingTrainingList`)
- Functions: camelCase (`handleSubmit`, `fetchData`)
- Prisma models: PascalCase (`SupportTicket`, `ProgramVote`)
- Database fields: camelCase (`programId`, `trainerId`)

## Error Handling
- API routes: Always return JSON errors with proper HTTP status codes
- Client fetches: Use `.catch(console.error)` — avoid crashing the UI
- Empty states: Show meaningful empty state components, never blank screens
- Loading states: Show spinners or skeletons during data fetches

## File Organization
- `components/ui/` — shadcn primitives only (Button, Card, Input, Badge, Dialog, Tabs, etc.)
- `components/` — application components (Sidebar, CalendarView, AuthProvider, etc.)
- `app/api/` — REST endpoints organized by role: `admin/`, `trainer/`, `hr/`
- `app/(dashboard)/` — page routes organized by role
- `lib/` — utilities (auth.ts, prisma.ts, utils.ts)
