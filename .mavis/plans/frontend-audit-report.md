# Frontend: Client-Side Processing & Render Audit

**Audit scope:** `AdminDashboardClient.tsx`, `app/(dashboard)/admin/page.tsx`, `app/(dashboard)/layout.tsx`
**Reviewed by:** Frontend Agent
**Date:** 2026-06-28

---

## Finding 1 — Initial Data Payload: Training Plans includes entire companies + unused bookings

**File:** `admin/page.tsx:20` + `admin.service.ts:164–256`

### Problem

`getAdminTrainingPlans(year)` returns an array of **all companies**, each containing their full training plan list (`items`), plus a `bookings` array per company that is fetched but **never used anywhere** in `AdminDashboardClient`:

```ts
// admin.service.ts:183–193 — fetched, serialized, sent to client, never used
bookings: {
  where: { programDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) }, status: { not: "CANCELLED" } },
  select: { totalFee: true, programDate: true, status: true },
},
```

The `companies` array (lines 165–195) also includes all fields like `_count.employees`, `departments`, `completedPlans`, `scheduledPlans`, etc. Most of these are used only for the `platformSummary` aggregate at the service level — the client only ever accesses `planData.companies.flatMap(c => c.items)`.

If a client has 50 companies and 20 training plans each, that's 1,000 plan items plus 50×20 = 1,000 unused booking records, all serialized and shipped over the wire.

### Fix Recommendation

**Option A (preferred):** Have the server component (`admin/page.tsx`) do the flatMap before passing to the client. Only pass the extracted `items` array + `platformSummary`:

```ts
// admin/page.tsx
const planData = await getAdminTrainingPlans(currentYear);
// Flatten on server — client only gets what it needs
const allPlanItems = planData.companies.flatMap(c => c.items);
return <AdminDashboardClient initialData={{ ...data, planItems: allPlanItems, platformSummary: planData.platformSummary }} />;
```

**Option B:** Add a `select` clause to `getAdminTrainingPlans` that excludes the `bookings` array and company-level aggregates the client doesn't need, or create a separate lightweight endpoint for the dashboard widget.

---

## Finding 2 — Client-side `flatMap` and `filter` computed on every render

**File:** `AdminDashboardClient.tsx:55–65`

### Problem

```ts
const items: any[] = initialData.planData?.companies?.flatMap((c: any) => c.items) || [];
const planStats = {
  pendingReview: items.filter((i: any) => i.status === "DRAFT" || i.status === "MATCHED").length,
  totalPlans: items.length,
};

const months: number[] = [];
for (let m = 0; m < 12; m++) {
  months.push((initialData.calData?.bookings || []).filter((b: any) => new Date(b.date).getMonth() === m).length);
}
const trend = months;
```

These are computed on every render. The `flatMap` iterates all companies and all items. The monthly filter loop iterates the full bookings array 12 times — **O(n×12)** per render.

### Fix Recommendation

Wrap `planStats` and `trend` in `useMemo`:

```ts
const items = useMemo(
  () => initialData.planData?.companies?.flatMap((c: any) => c.items) ?? [],
  [initialData.planData]
);
const planStats = useMemo(() => ({
  pendingReview: items.filter((i: any) => i.status === "DRAFT" || i.status === "MATCHED").length,
  totalPlans: items.length,
}), [items]);

const trend = useMemo(() => {
  const bks = initialData.calData?.bookings ?? [];
  return Array.from({ length: 12 }, (_, m) =>
    bks.filter((b: any) => new Date(b.date).getMonth() === m).length
  );
}, [initialData.calData?.bookings]);
```

Better still: compute `trend` in the service (`getAdminCalendar`) and send it pre-computed — the monthly loop already runs server-side in `monthlyStats` (lines 86–112 of `admin.service.ts`), so adding `trend` there is trivial.

---

## Finding 3 — Redundant state duplication of `events` and `upcoming`

**File:** `AdminDashboardClient.tsx:67–75`

### Problem

```ts
const [events, setEvents] = useState<CalendarEvent[]>(initialData.calData?.bookings || []);  // line 67
const [upcoming, setUpcoming] = useState<CalendarEvent[]>(initialData.calData?.upcoming || []); // line 68

useEffect(() => {
  setEvents(initialData.calData?.bookings || []);
  setUpcoming(initialData.calData?.upcoming || []);
}, [initialData.calData]);
```

Two problems here:
1. The initial state already captures `initialData.calData?.bookings` / `upcoming`. The `useEffect` runs immediately after mount and resets the same values — it's a no-op that causes a second render.
2. The `useEffect` depends on `initialData.calData` (the whole object), which is reference-stable from server render. So this effect fires once on mount and causes an unnecessary re-render with the same data.

If the goal is to allow `events`/`upcoming` to be mutated by `handleStatusChange` (line 82–90), then the initial state is fine and the `useEffect` is redundant. If the goal was reactivity to prop changes, the same effect with `initialData.calData` as dependency is the wrong approach — prop changes in Next.js server components don't update client state anyway.

### Fix Recommendation

Remove the `useEffect` entirely. The initial state is correct:

```ts
const [events, setEvents] = useState<CalendarEvent[]>(initialData.calData?.bookings ?? []);
const [upcoming, setUpcoming] = useState<CalendarEvent[]>(initialData.calData?.upcoming ?? []);
```

If `initialData` can change (e.g., via route refresh), the `handleStatusChange` already calls `router.refresh()` which will re-run the server component and re-render with fresh `initialData` — no extra state needed.

---

## Finding 4 — Monthly trend recomputed on every render (no memoization)

**File:** `AdminDashboardClient.tsx:61–65`

### Problem

The 12-iteration monthly filter loop (see Finding 2) has no memoization. It runs on every render, including when the parent re-renders for unrelated reasons (e.g., theme toggle in layout).

### Fix Recommendation

Same as Finding 2: `useMemo` or pre-compute in the service. The service already runs 3 DB queries for calendar data — adding `trend` to `monthlyStats` costs nothing.

---

## Finding 5 — Re-render propagation through prop objects

**File:** `AdminDashboardClient.tsx:299–304`

### Problem

```tsx
<EventDetailDialog
  event={selectedEvent}       // new object on every state change — fine
  open={dialogOpen}
  onClose={() => setDialogOpen(false)}  // new function every render — unnecessary re-render
  onStatusChange={handleStatusChange}    // same — new function every render
/>
```

`onClose` and `onStatusChange` are recreated as new arrow functions on every render of `AdminDashboardClient`. React's default comparison is reference equality, so `EventDetailDialog` will re-render on every parent render even though the handlers haven't changed functionally.

The same pattern appears with `<UpcomingTrainingList trainings={upcoming} onSelect={(t) => handleEventClick(t)} />` at line 247 — the `onSelect` prop is a new function every render.

### Fix Recommendation

Use `useCallback` for the handlers:

```ts
const handleEventClick = useCallback((event: CalendarEvent) => {
  setSelectedEvent(event);
  setDialogOpen(true);
}, []);

const handleStatusChange = useCallback((id: string, newStatus: string) => {
  const update = (list: CalendarEvent[]) =>
    list.map((e) => (e.id === id ? { ...e, status: newStatus } : e));
  setEvents(update);
  setUpcoming(update);
  setSelectedEvent(null);
  setDialogOpen(false);
  setTimeout(() => router.refresh(), 500);
}, [router]);
```

Then `onClose` can be `useCallback(() => setDialogOpen(false), [])`.

---

## Finding 6 — Hydration / SSR: layout.tsx auth redirect

**File:** `app/(dashboard)/layout.tsx:50–52`

### Problem

```ts
useEffect(() => {
  if (!loading && !user) router.push("/login");
}, [loading, user, router]);
```

The dashboard layout is a Client Component (`"use client"` at line 1). It renders a `<Loader2>` spinner while `loading` is true (line 61–67), then renders `null` if no user (line 69). The auth redirect happens in a `useEffect` — **there is no server-side redirect**.

For an unauthenticated user, the sequence is:
1. Server renders the loading spinner (or nothing useful)
2. Client hydrates, `useEffect` fires, redirects to `/login`

This means unauthenticated users briefly see the dashboard page before being redirected. On slow connections, they may see the spinner for a noticeable moment.

### Fix Recommendation

Add `middleware.ts` to handle auth at the edge, before the page renders:

```ts
// middleware.ts (at app root)
export function middleware(request: NextRequest) {
  const token = request.cookies.get("session-token");
  if (!token && !request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
```

This moves auth out of the client entirely and eliminates the flash of the loading state.

---

## Summary Table

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 1 | **High** | `admin/page.tsx:20` | Unused `bookings` field + all company aggregates shipped to client |
| 2 | **Medium** | `AdminDashboardClient.tsx:55–65` | `flatMap` + `filter` computed on every render |
| 3 | **Low** | `AdminDashboardClient.tsx:67–75` | Redundant `useEffect` syncing state already set in `useState` initialiser |
| 4 | **Medium** | `AdminDashboardClient.tsx:61–65` | Monthly trend (12× filter) recalculated on every render |
| 5 | **Low** | `AdminDashboardClient.tsx:247,299–304` | New function references passed as props causing child re-renders |
| 6 | **Low** | `app/(dashboard)/layout.tsx:50–52` | Auth redirect runs client-side only; unauthenticated users see brief flash |
