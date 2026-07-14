# Mobile HR Booking Detail — `/m/hr/bookings/[id]`

**Status:** spec only — not yet built
**Owner:** Mavis (draft), user review
**Date:** 2026-06-30

## Purpose

Give HR a mobile-native way to view a booking they scheduled. Currently the
only place this exists is the desktop page at `/(dashboard)/hr/bookings/[id]`,
which is unusable inside a phone-width viewport. The mobile HR calendar
(Phone 2/3 of `hr-calendar-reference.html`) needs this page as a tap target.

## Auth & data access

| Check | Source |
|---|---|
| Session must be HR role | `getSession()` from `@/lib/auth` |
| Booking must belong to HR's company | `booking.companyId === session.companyId` |
| No cross-tenant access | implicit via the `companyId` check |

Page redirects to `/login` if no session, or shows "Not found" if booking
doesn't belong to the session's company.

## Data source — reuse existing API

`GET /api/hr/bookings/[id]` already returns everything we need:

```ts
{
  id, status, programDate, totalFee, depositPaid, depositStatus,
  programTitle, programCategory, programDuration, locationType, trainerName,
  meetingLink, venuePreference, venueAddress, venueConfirmed,
  hrdfScheme, employerHrdfSubmitted, employerHrdfSubmittedAt,
  trainerHrdfSubmitted, trainerHrdfSubmittedAt, trainerDocumentsUrl,
  participants: Participant[], evaluations: Evaluation[], invoices: Invoice[]
}
```

`Participant` shape (from Prisma):
```ts
{
  id, name, email, phone, attendanceStatus: "PRESENT" | "ABSENT" | "PENDING",
  quizResults: { id, score, quizId }[]
}
```

**No new API needed.** Page will fetch this client-side (mirrors the desktop
HR detail's pattern) — keeps the contract single-source.

## Page structure (top → bottom)

```
/m/hr/bookings/[id]
├── Header (back arrow + program title + breadcrumb)
├── Status pill (CONFIRMED / PENDING / COMPLETED / CANCELLED)
├── Hero card
│   ├── Program title (large)
│   ├── Company + category
│   ├── Date / time / duration row
│   ├── Venue row (link if online)
│   ├── Trainer row
├── Attendance summary
│   ├── Present / Absent / Pending counts
│   └── Bar showing % attended
├── Participants list
│   └── For each: avatar + name + status pill + score if any
│       └── Tap → could later expand to per-participant detail
├── Quick action bar
│   ├── Primary: "Show QR for attendance" (modal)
│   ├── Secondary: "Cancel booking" (if upcoming + not COMPLETED)
│   └── Tertiary: "View on web" → /(dashboard)/hr/bookings/[id]
└── Bottom safe area spacer
```

## Visual / component choices (mirror the mockup)

- **Card pattern:** same `rounded-2xl border border-border bg-white p-4 shadow-sm`
  used in `/m/participant/bookings/[id]`
- **Status pill:** `STATUS_COLORS` map (CONFIRMED=emerald, PENDING=amber,
  COMPLETED=blue, CANCELLED=red) — same as desktop page, mobile-styled
- **Avatar:** `rounded-full` with initials, brand-color bg if no image
- **Bottom action bar:** floating pill at the bottom, same pattern as
  the calendar's bottom nav
- **QR modal:** trigger → fetch `/api/attendance/[id]` URL → render with
  `qrcode` lib (already in project) → modal overlay
- **Icons:** lucide-react (already used in mobile pages): `Calendar`, `Clock`,
  `MapPin`, `User`, `Video`, `Award`, `QrCode`, `XCircle`, `ExternalLink`,
  `ArrowLeft`

## Status → action matrix

| Booking status | Date | Visible actions |
|---|---|---|
| CONFIRMED | future | Show QR · Cancel · View on web |
| CONFIRMED | past | View attendance · View on web |
| PENDING | future | Show QR (if trainer confirmed) · Cancel · View on web |
| PENDING | past | (auto-flag as needs review) · View on web |
| COMPLETED | past | Download cert (per participant) · View on web |
| CANCELLED | any | View on web (read-only) |

## File to create

```
app/m/hr/bookings/[id]/page.tsx   # the page itself (~280 lines, like participant)
```

No new API route, no new components — reuse from the existing toolkit.

## Test plan

After build, verify with these manual checks against `localhost:3000`:

1. **Auth gate**
   - Logged out → visit `/m/hr/bookings/<any-id>` → redirects to `/login`
   - Logged in as PARTICIPANT → redirects away (auth guard)
   - Logged in as HR for company A → booking from company B → "Not found"

2. **Happy path** (HR for company with bookings)
   - Visit `/m/hr/bookings/<existing-id>` → page renders within 500ms
   - All sections present: header, status pill, hero, attendance, participants, action bar
   - Date/time matches what's in the DB
   - Status pill color matches status enum

3. **Tap-through from calendar**
   - From the mobile calendar mockup cards (Phone 2/3), the card link
     should land here. (To wire up: edit calendar cards to wrap in
     `<Link href="/m/hr/bookings/${booking.id}">`.)

4. **QR modal**
   - Tap "Show QR for attendance" → modal opens with QR code
   - QR encodes `${origin}/api/attendance/${id}` (matches desktop page logic)
   - Tap outside or close button → modal dismisses

5. **Cancel flow** (only if implemented)
   - Tap Cancel on an upcoming CONFIRMED booking → confirm dialog
   - Submit → `DELETE /api/hr/bookings/[id]` (already exists)
   - On success → `router.refresh()` + toast

6. **State edge cases**
   - `participants: []` → "No participants yet" empty state in list
   - `trainerName: null` → hide trainer row
   - `venueAddress: null` + `venuePreference: "as_program"` → show "Trainer default"

## Build plan (for the next turn)

1. Create `app/m/hr/bookings/[id]/page.tsx` (server component, fetch via prisma directly to match participant page pattern — fewer round trips than the desktop version)
2. Mirror the header, status pill, hero card, participants list patterns from `/m/participant/bookings/[id]`
3. Add HR-specific bits: attendance summary, cancel action, view-on-web link
4. Add QR modal as a client component (`"use client"`) for the qrcode import
5. `npx tsc --noEmit` clean → `npm run lint` (mobile) clean
6. Rebuild, restart server, verify with curl + Playwright

**Estimated size:** ~250–300 lines for the page, ~50 lines for the QR modal client component.

## Out of scope (intentionally)

- Editing booking details (date, venue, trainer) — desktop page already supports; add later if needed
- Per-participant detail drill-down — link to desktop for now
- Cert PDF download — already lives at `/api/participants/[id]/certificate`, can add per-participant button later
- HRDF claim submission — desktop-only flow, out of scope for mobile
- Attendance marking — trainer does this via the scan flow (`/api/attendance/[id]`), HR only views
