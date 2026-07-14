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
- `components/mobile-dashboard/` — mobile role dashboards (mobile-admin, mobile-hr, mobile-trainer, mobile-participant) + MobileViewLink + shared types
- `components/wizard/` — reusable wizard stepper + navigation (used by 4 mobile forms)
- `app/api/` — REST endpoints organized by role: `admin/`, `trainer/`, `hr/`, `ai/`
- `app/(dashboard)/` — desktop page routes organized by role
- `app/m/` — mobile-first page routes (app-shell layout, wizard forms, role-specific views)
- `lib/` — utilities (auth.ts, prisma.ts, utils.ts)
- `lib/services/` — shared data-fetching functions (admin.service.ts, hr.service.ts, trainer.service.ts)


## Service Layer Pattern

Core data-fetching logic lives in `lib/services/*.service.ts`. API route handlers are thin wrappers (auth check → call service → return JSON). Server-rendered pages call services directly — no fragile cross-module route-handler imports.

```typescript
// lib/services/example.service.ts
import { prisma } from "@/lib/prisma";

export async function getExampleStats(companyId: string) {
  const [total, active] = await Promise.all([
    prisma.model.count({ where: { companyId } }),
    prisma.model.count({ where: { companyId, status: "ACTIVE" } }),
  ]);
  return { total, active };
}
```

```typescript
// app/api/example/route.ts — thin wrapper
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getExampleStats } from "@/lib/services/example.service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const stats = await getExampleStats(session.companyId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Example error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
```

```typescript
// app/some-page/page.tsx — server component calling service directly
import { getSession } from "@/lib/auth";
import { getExampleStats } from "@/lib/services/example.service";

export default async function SomePage() {
  const session = await getSession();
  const stats = await getExampleStats(session.companyId!).catch(() => ({ total: 0, active: 0 }));
  return <div>...</div>;
}
```

## Wizard Component Pattern

Wizards use two reusable components from `components/wizard/`:
- `WizardStepper` — horizontal step indicators (steps: WizardStepDef[], current: number)
- `WizardNav` — sticky bottom bar with Back / Continue / Submit buttons

Colors are driven by CSS custom properties (`--brand`, `--brand-deep`) set on the parent dashboard root — no prop drilling needed for role-specific theming.

```typescript
// components/wizard/index.ts
export { WizardStepper, type WizardStepDef } from "./Stepper";
export { WizardNav } from "./Nav";
```

```typescript
// Usage in a mobile form
"use client";
import { useState } from "react";
import { WizardStepper, WizardNav } from "@/components/wizard";
import { User, Briefcase, Check } from "lucide-react";

const STEPS = [
  { label: "Details", icon: User },
  { label: "Role",     icon: Briefcase },
  { label: "Confirm",  icon: Check },
];

export function MyWizardForm() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setBusy(true);
    // ... API call ...
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <WizardStepper steps={STEPS} current={step} />
      {/* step content */}
      <WizardNav
        step={step} totalSteps={STEPS.length} busy={busy}
        onBack={() => setStep(s => s - 1)}
        onContinue={() => setStep(s => s + 1)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

## Mobile Component Pattern

Mobile pages live under `app/m/` with a self-contained layout (`app/m/layout.tsx`) that bypasses the desktop sidebar. Mobile role dashboards are in `components/mobile-dashboard/`.

```typescript
// app/m/layout.tsx — "use client" app shell with top bar
export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  // ... auth guard, loading state ...
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-12 border-b">
        {/* back button, title, language toggle, theme toggle, sign out */}
      </header>
      {children}
    </div>
  );
}
```

```typescript
// app/m/page.tsx — server component, resolves session → renders role-specific dashboard
import { getSession } from "@/lib/auth";
import { getTrainerStats, getTrainerActions } from "@/lib/services/trainer.service";
import { MobileTrainerDashboard } from "@/components/mobile-dashboard/mobile-trainer";

export default async function MobileHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "TRAINER") {
    const [stats, actData] = await Promise.all([
      getTrainerStats(session.id).catch(() => ({ /* fallback */ })),
      getTrainerActions(session.id).catch(() => ({ actions: [], summary: {} })),
    ]);
    return <MobileTrainerDashboard userName={session.name} data={{ stats, actData }} />;
  }
  // ... other roles ...
}
```


## Learning Studio Patterns

### MiniMax API response shapes
MiniMax embedding API may return vectors in one of three shapes:
- `data.vectors` (older versions)
- `data` (direct array)
- `vectors` (flat)

Always check all three when parsing:
```typescript
const vectors: number[][] = data.vectors ?? data.data?.vectors ?? data.data ?? [];
```

### SQLite VSS (no extension)
Store float32 embeddings as base64 strings in a TEXT column:
```typescript
function float32ToBase64(arr: number[]): string {
  const bytes = new Uint8Array(new Float32Array(arr).buffer);
  return btoa(String.fromCharCode(...bytes));
}
function base64ToFloat32(b64: string): number[] {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return Array.from(new Float32Array(bytes.buffer));
}
```

### File parser error handling
Never throw — return empty string on failure. Partial success is acceptable for the Learning Studio pipeline.

### .env.local for secrets
Local dev secrets (API keys, base URLs, model names) go in `.env.local`, not `.env`. Use placeholders for keys that need user input (e.g. `MINIMAX_API_KEY=your_key_here`).

### Button — no asChild support
The `Button` component in `components/ui/button.tsx` is built on `@base-ui/react/button`, NOT radix-ui. It does **not** support `asChild` (no slot pattern). To make a button act as a link, use `onClick={() => window.open(url, "_blank")}` or `onClick={() => router.push(url)}` instead of `asChild`.

### RadioGroup — base-ui API
`@base-ui/react/radio-group` only exports `RadioGroup`. There is no `RadioGroupItem` — use plain styled `<button>` elements instead (or write custom radio buttons with a controlled `answers` state object).
