# Architecture Context — TrainHub Malaysia

## Tech Stack
- **Framework:** Next.js 16.2.9 (App Router)
- **UI:** React 19.2, Tailwind CSS v4, shadcn/ui base-nova (@base-ui/react)
- **Database:** SQLite via Prisma 7 ORM + PrismaLibSql adapter
- **Auth:** JWT (jose) with HTTP-only cookies, custom `proxy.ts`
- **Icons:** Lucide React
- **Charts:** Recharts
- **QR Codes:** `qrcode` library
- **PDF Export:** `jspdf`

## Project Structure
```
├── app/
│   ├── (auth)/login/              # Login page (with mobile/desktop view selector)
│   ├── (dashboard)/
│   │   ├── admin/                  # Dashboard, bookings, invoices, trainers, training-plans, team-building, sales, finance, support
│   │   ├── trainer/                # Dashboard, programs, quiz builder, materials, earnings, messages, evaluations
│   │   ├── hr/                     # Dashboard, marketplace, bookings, employees, training-planner, team-building, evaluations, leaves, attendance, claims, sop, hrdf-calculator, integration, messages
│   │   └── participant/            # Dashboard, certificate tracking, quiz history
│   ├── m/                          # Mobile-first dashboard (full-screen app shell, role-specific views, wizards)
│   ├── api/                        # 65+ REST API routes
│   ├── globals.css                 # Vercel-inspired design tokens
│   └── layout.tsx                  # Root layout with auth provider
├── components/
│   ├── ui/                         # shadcn/ui primitives (Button, Card, Input, Badge, Dialog, Tabs, Skeleton...)
│   ├── mobile-dashboard/           # Mobile role dashboards (Admin, HR, Trainer, Participant) + MobileViewLink
│   ├── wizard/                     # Reusable wizard stepper (Stepper.tsx) + navigation (Nav.tsx)
│   ├── Sidebar.tsx                 # Role-aware sidebar navigation
│   ├── CalendarView.tsx            # Month/Year training calendar
│   ├── NotificationBell.tsx        # Unified inbox (notifications + contextual actions, role-aware tabs)
│   ├── CollapsibleSection.tsx      # Expandable section wrapper
│   ├── MessagesInbox.tsx           # Split-pane chat inbox
│   ├── ExportButton.tsx            # Reusable CSV export
│   ├── WorkflowGuideModal.tsx      # HRDF claim workflow guide
│   ├── UpcomingTrainingList.tsx    # Upcoming training cards
│   ├── EventDetailDialog.tsx       # Training event modal
│   ├── AuthProvider.tsx            # Client-side auth context
│   └── ClientProviders.tsx         # App-wide providers wrapper
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── auth.ts                     # JWT session management
│   ├── malaysia-holidays.ts        # Malaysian public holidays + special periods
│   ├── utils.ts                    # cn() classname merger
│   ├── format.ts                   # MYR formatting utilities
│   └── services/                   # Shared data-fetching layer
│       ├── admin.service.ts        # Admin stats, calendar, changelog, training plans, actions
│       ├── hr.service.ts           # HR stats, actions, AI recommendations
│       └── trainer.service.ts      # Trainer stats, actions
├── prisma/
│   ├── schema.prisma               # 24 database models
│   └── seed.ts                     # Seed script (6 companies, 72+ employees, 19 plan items)
├── proxy.ts                        # Auth middleware (role-based route protection)
└── public/thumbnails/              # SVG gradient program cards
```

## Database Schema (24 models)

### Core
- **User** — email, password hash, role (ADMIN/TRAINER/HR), company reference
- **Company** — name, address, state, registration number
- **TrainerProfile** — bio, expertise (JSON), bank details, hourly rate, rating

### Training
- **Program** — title, description, category, duration, max participants, price/pax, location type, status (DRAFT/PUBLISHED/ARCHIVED), thumbnailUrl
- **Module** — title, description, order index, duration (cascades from Program)
- **Quiz** — title, passing score, time limit (cascades from Module)
- **Question** — text, type (MCQ/TRUE_FALSE/SHORT_ANSWER), options (JSON), correct answer, points
- **Material** — title, file URL, file type (cascades from Module)
- **ItineraryItem** — type (REGISTRATION/MODULE/BREAK/MEAL/CLOSING), start/end times

### Bookings
- **Booking** — program date, total fee, deposit, status, dual HRDF tracking (employer + trainer)
- **Participant** — name, email, IC, department, attendance, quiz score, certificate URL
- **Evaluation** — title, questions (JSON), responses (JSON), summary score

### Financial
- **Invoice** — invoice number, amount, status, due date, financial breakdown (program fee, trainer fee, HRDF fee, platform fee, SST, net pay)

### HR
- **Employee** — name, IC, email, phone, department, position, date joined, employment type, status
- **Leave** — type (ANNUAL/MEDICAL/HOSPITALISATION/etc.), dates, days, status
- **Attendance** — date, clock in/out, status
- **Payroll** — salary, allowances, deductions, statutory contributions (EPF/SOCSO/EIS/PCB)

### Planning
- **TrainingPlanItem** — title, category, department, target count, target month/year, estimated cost, priority, status pipeline (DRAFT→MATCHED→SCHEDULED→COMPLETED→CANCELLED), linked booking

### Communication & Other
- **Message** — sender, receiver, booking reference, content, read status
- **Review** — HR rates trainer (1-5 stars) per booking
- **ProgramVote** — HR upvotes programs for priority
- **SupportTicket** — subject, description, category, priority, status
- **Changelog** — version, type (FEATURE/FIX/IMPROVEMENT), title, details
- **TeamBuildingRequest** — full event planning with HRDF + approval workflow
- **TrainerAvailability** — date, status (AVAILABLE/UNAVAILABLE), reason

## Authentication Flow
- **Login:** Email/password → SHA-256 hash → JWT token → HTTP-only cookie (`trainhub_session`)
- **Proxy (`proxy.ts`):** Validates JWT, redirects unauthenticated to `/login`, enforces role routing
- **Session:** `getSession()` reads cookie, verifies JWT, returns `{ id, email, name, role, companyId }`
- **Client:** `AuthProvider` React context + `/api/auth/me` endpoint

## Route Map

### Admin (`/admin`)
| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard with stats, calendar, smart actions |
| `/admin/bookings` | All bookings list |
| `/admin/bookings/[id]` | Booking detail + checklist + HRDF |
| `/admin/training-plans` | All-company training plan oversight |
| `/admin/team-building` | Team building request review |
| `/admin/invoices` | Invoice tracking |
| `/admin/invoices/[id]` | Invoice detail + payment breakdown |
| `/admin/trainers` | Trainer directory |
| `/admin/trainers/[id]` | Trainer profile + stats |
| `/admin/sales` | Sales panel (Recharts) |
| `/admin/finance` | Finance dashboard |
| `/admin/support` | Support tickets |

### Trainer (`/trainer`)
| Route | Purpose |
|-------|---------|
| `/trainer` | Dashboard + availability calendar |
| `/trainer/programs` | My programs |
| `/trainer/programs/new` | Create program wizard |
| `/trainer/programs/[id]` | Program detail |
| `/trainer/programs/[id]/edit` | Edit program |
| `/trainer/programs/[id]/modules` | Module manager |
| `/trainer/programs/[id]/quiz` | Quiz list |
| `/trainer/programs/[id]/quiz/questions` | Quiz builder |
| `/trainer/programs/[id]/quiz/results` | Quiz results |
| `/trainer/materials` | Materials library |
| `/trainer/messages` | Messages inbox |
| `/trainer/earnings` | Earnings dashboard |

### HR (`/hr`)
| Route | Purpose |
|-------|---------|
| `/hr` | Dashboard with AI recommendations |
| `/hr/marketplace` | Browse programs |
| `/hr/marketplace/[id]` | Program detail + booking |
| `/hr/bookings` | My bookings |
| `/hr/bookings/[id]` | Booking detail + HRDF |
| `/hr/training-planner` | Training planner (calendar + pipeline) |
| `/hr/team-building` | Team building planner |
| `/hr/employees` | Employee list |
| `/hr/employees/upload` | Bulk CSV upload |
| `/hr/leaves` | Leave management |
| `/hr/attendance` | Attendance tracking |
| `/hr/evaluations` | Evaluation list |
| `/hr/evaluations/[id]/summary` | Performance graph + QR + PDF |
| `/hr/evaluations/[id]/blast` | Send evaluation |
| `/hr/hrdf-calculator` | HRDF calculator |
| `/hr/sop` | SOP & HRDF guide |
| `/hr/integration` | Integration guide |
| `/hr/messages` | Messages inbox |
| `/hr/vote` | Vote & request programs |
| `/hr/support` | Support tickets |
| `/hr/training-needs` | AI needs analyzer |

## API Routes (60+)
All under `app/api/` with role-based prefixes: `/api/admin/*`, `/api/trainer/*`, `/api/hr/*`, `/api/auth/*`, `/api/messages/*`.

## Key Design Decisions
1. **Table-based calendar** — HTML `<table>` for reliable cross-browser calendar rendering
2. **Flexbox sidebar** — Flex child on desktop, drawer pattern on mobile
3. **Cascade delete** — Program deletion cleans up bookings→participants→evaluations→invoices→modules→quizzes→questions
4. **JSON body validation** — All POST/PUT routes use try-catch on `request.json()` with 400 responses
5. **JWT cookies** — HTTP-only session cookies, 7-day expiry, verified via `jose`
6. **Production mode for Windows** — Turbopack has NUL device bug on Windows; use `--webpack` for dev or production build
7. **Notes-based admin approval** — Admin approve/reject uses notes markers (`[Admin Approved]`, `[Admin Rejected]`) instead of separate status field, keeping pipeline simple
8. **Static holiday data** — Malaysian holidays embedded in code (not API-dependent) for reliability
9. **Shared service layer** — Core data-fetching logic extracted to `lib/services/*.service.ts`, called by both API routes (thin auth wrappers) and server-rendered pages (direct calls). Eliminates fragile cross-module route-handler imports.
10. **Mobile/Desktop view toggle** — Login page offers mobile vs desktop dashboard choice, persisted in localStorage. Desktop dashboards show a floating `MobileViewLink` (fixed button, visible on small viewports) to jump to `/m`.
11. **Wizard pattern** — Reusable `WizardStepper` + `WizardNav` components using CSS custom properties (`--brand`, `--brand-deep`) for role-specific theming without prop drilling. Used by 4 forms: new program, new booking, new employee, invite trainer.
12. **Mobile app shell** — `/m/layout.tsx` is a self-contained `"use client"` layout with its own top bar (back, title, language toggle, theme toggle, sign out) — bypassing the desktop sidebar/drawer completely.
