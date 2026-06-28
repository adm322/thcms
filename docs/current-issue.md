# Current Issues — TrainHub Malaysia

> Last updated: 2026-06-22 — All pages verified, build passing

## 🔴 Active Issues

### 1. File uploads are URL-only
**Impact:** Materials are stored as text URLs, not actual file uploads.
**Fix:** Add multipart upload API (partially done — `/api/admin/upload` exists for team-building docs).

### 2. Evaluation blast doesn't send real emails
**Impact:** Sets `sentAt` but no actual email delivery.
**Fix:** Integrate Resend/SendGrid for real email.

### 3. No pagination on list endpoints
**Impact:** Most list APIs return entire tables. Some have high limits (10000) as workaround.
**Fix:** Add `?page=1&limit=20` + Prisma `skip`/`take` consistently.

## 🟡 Edge Cases

### 4. Quiz has no time-tracking for participant attempts
### 5. No bulk actions on admin tables (batch approve, batch reject)
### 6. No notification system (in-app + email)
### 7. Calendar year view exists but no quarter view in CalendarView component
### 8. Training plan "Matched" items need actual program-matching UI (currently manual matchedProgramId)
### 9. No dark mode polish (toggle exists but some components not fully themed)

## ✅ Recently Completed (this session)

- [x] **Training Planner Rework** — Annual budget bar, smart calendar (Q1-Q4, 12 month cards), pipeline kanban (5 columns with tooltips), one-click booking, add/edit/delete plan items
- [x] **Admin Training Plans** — All-company oversight page, approve/reject with reasons, add notes, year selection, expandable per-company drill-down
- [x] **TrainingPlanItem Model** — New Prisma model (title, category, department, targetCount, targetMonth/Year, estimatedCost, priority, status pipeline, booking link, matchedProgram link)
- [x] **Malaysian Holidays Utility** — 2026 public holidays (40+), special periods (Ramadan, Hari Raya, CNY, Deepavali), blackout periods, conflict detection
- [x] **Collapsible Sections** — Admin, HR, and Trainer dashboards have collapsible sections to reduce clutter
- [x] **Smart Action Banners** — Auto-refreshing contextual alerts on all 3 dashboards (HRDF deadlines, upcoming trainings, pending approvals)
- [x] **Trainer Actions API** — `/api/trainer/actions` with 7 action types (upcoming, HRDF claims, unpublished programs, zero-bookings, availability gaps, revenue, pending)
- [x] **Expandable action list** — "+N more items" toggle with chevron in NotificationBell Actions tab
- [x] **Availability Calendar** — Trainer day-toggle calendar synced across admin/HR
- [x] **Dual-Party HRDF Tracking** — Employer + trainer independent claim submission on all bookings and team-building requests
- [x] **Training Checklist** — 15-item interactive checklist on booking detail, localStorage persistence, pre/during/post phases
- [x] **Program Thumbnails** — SVG gradient cards with category labels, onError fallback
- [x] **Messages Inbox** — Split-pane chat on HR and Trainer portals
- [x] **CSV Export** — Reusable ExportButton component
- [x] **Workflow Guide Modal** — 6-step HRDF claim lifecycle visualization
- [x] **HRDF Calculator** — Malaysian ACM rates, live breakdown
- [x] **SOP Guide** — 4-tab Malaysian SOP with HRDF compliance
- [x] **Leave Management** — Filter, approve/reject
- [x] **Attendance Tracking** — Monthly summary
- [x] **Claims Management** — Employee claims with approve/reject
- [x] **Bug Fixes** — JSX nesting errors in admin/HR dashboards, admin note state bleed, year change collapse, reject guard on terminal items
