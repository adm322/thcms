# Progress Tracker — TrainHub Malaysia

## ✅ Completed Features

### Admin
- [x] Dashboard with stats, monthly summary bar, calendar + upcoming tabs
- [x] **Smart Action Banner** — auto-refreshing contextual alerts (pending approvals, HRDF deadlines, reimbursements)
- [x] **Collapsible Sections** — programs, quick links, changelog (reduces dashboard clutter)
- [x] Training Calendar (table-based, month/year views, color-coded by category)
- [x] Event detail dialog with approve/reject/complete actions
- [x] All bookings management with status filters + HRDF claim badges
- [x] Booking detail with participants, training checklist (15 items, localStorage), dual-party HRDF tracking
- [x] Reimbursement approval (approve/reject)
- [x] Invoice management with detail, mark-as-paid
- [x] Trainer directory with profile, stats, programs, availability
- [x] **Training Plans** — all-company oversight, expandable per-company cards, approve/reject/notes, year selection
- [x] Team Building requests — filterable list, approve/reject with docs, dual HRDF tracking
- [x] Support ticket management
- [x] Sales Panel — line/donut/bar charts (recharts), KPI cards
- [x] Finance dashboard
- [x] Featured Programs — star toggle to feature/unfeature
- [x] Changelog — version tracking panel

### Trainer Portal
- [x] Dashboard with availability calendar, stats, upcoming programs
- [x] **Smart Action Banner** — upcoming trainings, HRDF claim deadlines, unpublished/zero-booking program alerts
- [x] **Collapsible Sections** — availability calendar, upcoming programs, quick links
- [x] **Availability Calendar** — month picker, toggle days (available/unavailable), synced across admin/HR
- [x] Program Builder — 3-step wizard (info → modules → pricing)
- [x] Program CRUD with thumbnail support, SVG gradient fallbacks
- [x] Program cloning (deep copy with modules)
- [x] Module Manager — add, inline edit, delete
- [x] Quiz Builder — MCQs, True/False, Short Answer, passing scores
- [x] Quiz Results — participant scores, pass/fail, progress bars
- [x] Materials library (grid view across programs)
- [x] Earnings dashboard (real revenue data + breakdown)
- [x] Evaluations view — performance bar charts, per-question analysis
- [x] **Messages Inbox** — split-pane chat with unread badges, polling
- [x] Calendar — monthly booking calendar

### HR Portal
- [x] Dashboard with stats, category breakdown, AI recommendations
- [x] **Smart Action Banner** — HRDF claim deadlines, upcoming prep alerts, pending approvals
- [x] **Collapsible Sections** — quick actions & insights
- [x] Program Marketplace — browse, search, filter by category/location, thumbnail images
- [x] Booking Flow — date picker, participant count, pricing, 30% deposit
- [x] My bookings list & detail with HRDF claim tracking
- [x] Employee management + bulk CSV upload with template download
- [x] Employee search — filter by name, email, department, position
- [x] **Training Planner** — annual budget bar, smart calendar (Q1-Q4, 12 month cards), pipeline kanban (5 columns with tooltips), one-click booking, add/edit/delete plan items
- [x] **Admin-Approved Planning** — admin can approve/reject/add notes to plan items from /admin/training-plans
- [x] **Malaysian Holiday Awareness** — 40+ public holidays, Ramadan/Hari Raya/CNY/Deepavali markers, peak season warnings, conflict detection
- [x] Team Building Planner — 4-step wizard with 12 activities, 10 venues, HRDF calculation, approval workflow submission
- [x] Evaluations — per-question bar charts, star ratings, comments
- [x] QR Code + PDF export for evaluations
- [x] Evaluation Blast — send evaluation forms to participants
- [x] Vote & Request — upvote programs, leaderboard, most-voted gets priority
- [x] Support Tickets — create with category/priority, track status
- [x] Reviews API — submit ratings for completed programs
- [x] Calendar — monthly booking calendar
- [x] **HRDF Calculator** — Malaysian ACM rates, live cost breakdown, rules reference cards
- [x] **SOP Guide** — 4-tab guide (Overview, HR SOP, Training Admin SOP, Vendor SOP) with Malaysian HRDF workflow
- [x] **Integration Guide** — 4-step sync process, CSV export, Malaysian software compatibility
- [x] **Messages Inbox** — split-pane chat with HR ↔ Trainer conversations
- [x] **Leave Management** — filter, approve/reject, leave type tracking
- [x] **Attendance Tracking** — monthly attendance summary
- [x] **Claims Management** — employee claims with approve/reject
- [x] **CSV Export** — reusable ExportButton component
- [x] **Workflow Guide** — 6-step modal showing HRDF claim lifecycle

### Infrastructure
- [x] Auth system (login/logout/session, JWT cookies, role-based proxy)
- [x] Responsive layout (flexbox sidebar + mobile drawer + scroll lock)
- [x] Vercel-inspired design system (Geist, pill buttons, stacked shadows)
- [x] **Prisma schema** — 24 models including new TrainingPlanItem
- [x] **Seed data** — 6 companies, 6 HR users, 3 trainers, 1 admin, 72+ employees, 12 programs, 23 bookings, 19 training plan items
- [x] **60+ REST API routes** across admin, trainer, HR
- [x] **Malaysian holidays utility** — 2026 public holidays, special periods (Ramadan, Hari Raya, CNY), helper functions
- [x] In-app messaging API (per-booking conversations)
- [x] Program thumbnails (SVG gradient cards with category labels)
- [x] Dual-party HRDF claim tracking (employer + trainer) on all bookings and team-building requests
- [x] Training checklist (15 items with localStorage, pre/during/post phases)
- [x] Expandable smart action banner (+N more items toggle)

## 🚧 Remaining Work

- [ ] File uploads (multipart) for training materials
- [ ] Real email sending for evaluation blast
- [ ] Pagination on list endpoints (currently high-limit workaround)
- [ ] Bulk actions on admin tables
- [ ] Notification system (in-app + email)
- [ ] Mobile quiz-taking with QR scan
- [ ] Atomic program+module batch creation
- [ ] Calendar Google/Outlook sync
- [ ] Certificate auto-generation on quiz pass
- [ ] Dark mode polish
