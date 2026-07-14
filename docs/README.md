# TrainHub Malaysia — HR & Training Development Platform

> Full-stack Next.js 16 application connecting HR departments with training vendors across Malaysia.

## 🚀 Quick Start

```bash
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev -- --webpack    # Windows: use --webpack (Turbopack has NUL device bug)
```

### Environment Variables

Create a `.env` file in the project root:

```bash
# AI Provider (optional - falls back to mock responses)
OPENAI_API_KEY=your_openai_api_key

# Database (default: SQLite)
DATABASE_URL=file:./dev.db

# Auth
JWT_SECRET=your_jwt_secret
```

Open **http://localhost:3000** — login page with demo quick-login buttons.

> **Production mode** (stable, fast): `npx next build --webpack && npx next start -p 3000`

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@trainhub.my` | `password123` |
| Trainer | `aisha@trainhub.my` | `password123` |
| Trainer | `jason@trainhub.my` | `password123` |
| Trainer | `sarah@trainhub.my` | `password123` |
| HR | `hr@petronas.my` | `password123` |
| HR | `hr@maybank.my` | `password123` |
| HR | `hr@topglove.my` | `password123` |
| HR | `hr@airasia.my` | `password123` |
| HR | `hr@tm.my` | `password123` |
| HR | `hr@sdarby.my` | `password123` |
| Participant | `participant@demo.com` | `password123` |

---

## 🏗️ Architecture

### Tech Stack
- **Framework:** Next.js 16.2.9 (App Router)
- **UI:** React 19.2, Tailwind CSS v4, shadcn/ui base-nova (@base-ui/react)
- **Database:** SQLite via Prisma 7 ORM + PrismaLibSql adapter
- **Auth:** JWT (jose) with HTTP-only cookies, custom `proxy.ts`
- **Icons:** Lucide React
- **Charts:** Recharts
- **PDF:** jspdf
- **QR:** qrcode

### Project Structure
```
├── app/
│   ├── (auth)/login/              # Login page (with mobile/desktop view selector)
│   ├── (dashboard)/
│   │   ├── admin/                  # Admin dashboard, bookings, invoices, trainers, training-plans, team-building, sales, finance
│   │   ├── trainer/                # Trainer dashboard, programs, quiz builder, materials, earnings, messages, availability
│   │   ├── hr/                     # HR dashboard, marketplace, bookings, employees, training-planner, team-building, evaluations, sop, hrdf-calculator, leaves, attendance, claims, messages
│   │   └── participant/            # Participant dashboard, certificates, quiz history
│   ├── m/                          # Mobile-first dashboard (role-specific views, full-screen app shell)
│   ├── api/                        # 60+ REST API routes
│   ├── globals.css                 # Vercel-inspired design tokens
│   └── layout.tsx                  # Root layout with auth provider
├── components/
│   ├── ui/                         # shadcn/ui primitives (Button, Card, Input, Badge, Dialog, Tabs, Skeleton...)
│   ├── mobile-dashboard/           # Mobile role dashboards (Admin, HR, Trainer, Participant) + MobileViewLink
│   ├── wizard/                     # Reusable wizard stepper & nav (used by 4 forms)
│   ├── Sidebar.tsx                 # Role-aware sidebar navigation
│   ├── CalendarView.tsx            # Month/Year training calendar
│   ├── NotificationBell.tsx        # Unified inbox (notifications + contextual actions, role-aware tabs)
│   ├── CollapsibleSection.tsx      # Expandable section wrapper
│   ├── MessagesInbox.tsx           # Split-pane chat inbox
│   ├── ExportButton.tsx            # Reusable CSV export
│   ├── WorkflowGuideModal.tsx      # 6-step HRDF claim workflow guide
│   ├── UpcomingTrainingList.tsx    # Detailed upcoming training cards
│   ├── EventDetailDialog.tsx       # Training event modal with approve/reject
│   ├── AuthProvider.tsx            # Client-side auth context
│   └── ClientProviders.tsx         # App-wide providers wrapper
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── auth.ts                     # JWT session management
│   ├── malaysia-holidays.ts        # 2026 Malaysian public holidays + special periods
│   ├── utils.ts                    # cn() classname merger
│   ├── format.ts                   # MYR formatting utilities
│   └── services/                   # Shared data-fetching layer (used by both API routes and pages)
│       ├── admin.service.ts        # Admin stats, calendar, changelog, training plans, actions
│       ├── hr.service.ts           # HR stats, actions, AI recommendations
│       └── trainer.service.ts      # Trainer stats, actions
├── prisma/
│   ├── schema.prisma               # 24 database models
│   └── seed.ts                     # Seed script (6 companies, 72+ employees, 19 training plan items)
├── proxy.ts                        # Auth middleware (role-based route protection)
└── public/thumbnails/              # SVG gradient course cards
```

---

## 📊 Database (24 models)

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
- **Booking** — program date, total fee, deposit, status (PENDING/CONFIRMED/COMPLETED/CANCELLED), dual HRDF tracking (employer + trainer)
- **Participant** — name, email, IC, department, attendance, quiz score, certificate URL
- **Evaluation** — title, questions (JSON), responses (JSON), summary score

### Financial
- **Invoice** — invoice number, amount, status, due date, financial breakdown (program fee, trainer fee, HRDF fee, platform fee, SST, net pay)

### HR
- **Employee** — name, IC, email, phone, department, position, date joined, employment type, status
- **Leave** — type (ANNUAL/MEDICAL/HOSPITALISATION/etc.), dates, days, status
- **Attendance** — date, clock in/out, status (PRESENT/LATE/ABSENT/etc.)
- **Payroll** — salary, allowances, deductions, statutory contributions (EPF/SOCSO/EIS/PCB)

### Planning
- **TrainingPlanItem** — title, category, department, target count, target month/year, estimated cost, priority, status pipeline (DRAFT→MATCHED→SCHEDULED→COMPLETED), linked booking

### Communication
- **Message** — sender, receiver, booking reference, content, read status
- **Review** — HR rates trainer (1-5 stars) with comment per booking
- **ProgramVote** — HR upvotes programs for priority
- **SupportTicket** — subject, description, category, priority, status
- **Changelog** — version, type (FEATURE/FIX/IMPROVEMENT), title, details
- **TeamBuildingRequest** — full event planning with HRDF + approval workflow
- **TrainerAvailability** — date, status (AVAILABLE/UNAVAILABLE), reason

---

## 📄 Feature Summary by Role

### 🛡️ Admin
- Stats dashboard with monthly summary bar
- Smart Action Banner (pending approvals, HRDF followups)
- Collapsible sections (programs, quick links, changelog)
- Training Calendar (month/year views, color-coded by category)
- Booking management with HRDF claim badges + training checklist
- Training Plans oversight (all companies, approve/reject/notes)
- Team Building request review with dual HRDF tracking
- Invoice tracking, trainer directory
- Trainer invite flow (generates temp password)
- Sales & Finance dashboards with Recharts
- Featured programs + changelog
- **📱 Mobile:** bookings, programs, trainers, invoices, finance, trainer invite wizard

### 🎓 Trainer
- Dashboard with availability calendar, stats, upcoming programs
- Smart Action Banner (upcoming trainings, HRDF deadlines, zero-booking alerts)
- Collapsible sections (availability, programs, quick links)
- Program Builder (3-step wizard) + module/quiz/materials management
- Availability calendar (toggle days, syncs to admin/HR)
- Quiz builder (MCQs, True/False, Short Answer) + results
- Messages inbox (split-pane chat)
- Earnings dashboard with breakdown
- **📱 Mobile:** programs, program wizard, bookings, availability, calendar, earnings, evaluations

### 🏢 HR
- Dashboard with AI recommendations
- Smart Action Banner (HRDF deadlines, upcoming prep, pending)
- Program Marketplace with search, filter, thumbnails
- **Training Planner** — annual budget bar, smart calendar (Q1-Q4 with Malaysian holidays), pipeline kanban, one-click booking
- Team Building Planner (4-step wizard, 12 activities, 10 venues)
- Employee management + bulk CSV upload
- HRDF Calculator (Malaysian ACM rates)
- SOP Guide (4 tabs: Overview, HR, Training Admin, Vendor)
- Integration Guide (CSV export, Malaysian software)
- Leave management, attendance tracking, claims management
- Messages inbox (HR ↔ Trainer)
- Evaluations (QR code, PDF export, evaluation blast)
- Vote & Request, Support Tickets
- **📱 Mobile:** employees, add employee wizard, bookings + QR, new booking wizard, calendar, claims

---

## 🗺️ Route Map

### Admin (`/admin`)
```
/admin                              # Dashboard
/admin/bookings                     # All bookings
/admin/bookings/[id]                # Booking detail + checklist + HRDF
/admin/training-plans               # All-company training plan oversight
/admin/team-building                # Team building request review
/admin/invoices                     # Invoice list
/admin/invoices/[id]                # Invoice detail + payment breakdown
/admin/trainers                     # Trainer directory
/admin/trainers/[id]                # Trainer profile + stats + availability
/admin/sales                        # Sales panel (Recharts)
/admin/finance                      # Finance dashboard
/admin/support                      # Support tickets
```

### Trainer (`/trainer`)
```
/trainer                            # Dashboard + availability calendar
/trainer/programs                   # My programs
/trainer/programs/new               # Create program wizard
/trainer/programs/[id]              # Program detail
/trainer/programs/[id]/edit         # Edit program
/trainer/programs/[id]/modules      # Module manager
/trainer/programs/[id]/quiz         # Quiz list
/trainer/programs/[id]/quiz/questions  # Quiz builder
/trainer/programs/[id]/quiz/results    # Quiz results
/trainer/materials                  # Materials library
/trainer/messages                   # Messages inbox
/trainer/earnings                   # Earnings dashboard
```

### HR (`/hr`)
```
/hr                                 # Dashboard
/hr/marketplace                     # Browse programs
/hr/marketplace/[id]                # Program detail + booking
/hr/bookings                        # My bookings
/hr/bookings/[id]                   # Booking detail + HRDF
/hr/training-planner                # Training planner (calendar + pipeline)
/hr/team-building                   # Team building planner
/hr/employees                       # Employee list
/hr/employees/upload                # Bulk CSV upload
/hr/leaves                          # Leave management
/hr/attendance                      # Attendance tracking
/hr/evaluations                     # Evaluation list
/hr/evaluations/[id]/summary        # Performance graph + QR + PDF
/hr/evaluations/[id]/blast          # Send evaluation
/hr/hrdf-calculator                 # HRDF calculator
/hr/sop                             # SOP & HRDF guide
/hr/integration                     # Integration guide
/hr/messages                        # Messages inbox
/hr/vote                            # Vote & request programs
/hr/support                         # Support tickets
/hr/training-needs                  # AI needs analyzer
```

### Participant (`/participant`)
```
/participant                        # Dashboard with certificates, quiz history, upcoming classes
```

### Mobile (`/m`) — full-screen app shell
```
/m                                  # Role-aware mobile home (auto-detected from session)
/m/admin/bookings                   # Admin: bookings list
/m/admin/programs                   # Admin: programs list
/m/admin/trainers                   # Admin: trainer directory
/m/admin/trainers/invite            # Admin: invite new trainer (wizard)
/m/admin/invoices                   # Admin: invoices
/m/admin/finance                    # Admin: finance dashboard
/m/trainer/programs                 # Trainer: programs
/m/trainer/programs/new             # Trainer: new program (wizard)
/m/trainer/bookings/[id]            # Trainer: booking detail
/m/trainer/availability             # Trainer: availability calendar
/m/trainer/calendar                 # Trainer: monthly calendar
/m/trainer/earnings                 # Trainer: earnings
/m/trainer/evaluations              # Trainer: evaluations
/m/hr/employees                     # HR: employee list
/m/hr/employees/new                 # HR: add employee (wizard)
/m/hr/bookings/[id]                 # HR: booking detail + QR code
/m/hr/new-booking                   # HR: new booking (wizard)
/m/hr/calendar                      # HR: calendar
/m/hr/claims                        # HR: claims list
/m/participant                      # Participant: dashboard
/m/participant/scan                 # Participant: QR scanner
/m/participant/class/[id]           # Participant: class detail
/m/participant/bookings/[id]        # Participant: booking detail
/m/notifications                    # Notifications inbox
/m/profile                          # Profile + sign out
```

### API Routes (65+)
```
/api/admin/stats, calendar, bookings, bookings/[id]/status, invoices, invoices/[id], trainers, trainers/availability, trainers/invite, programs/feature, changelog, team-building, team-building/[id], training-plans, training-plans/[id], upload, actions, support

/api/trainer/stats, calendar, programs, programs/[id], programs/[id]/clone, programs/[id]/modules, programs/[id]/itinerary, programs/[id]/quizzes, modules/[moduleId], quizzes/[quizId], quizzes/[quizId]/questions, quizzes/[quizId]/results, questions/[questionId], materials, earnings, evaluations, evaluations/[id], availability, actions

/api/hr/stats, programs, programs/[id], bookings, bookings/[id], employees, employees/upload, leaves, leaves/[id], attendance, evaluations, evaluations/[id], evaluations/[id]/blast, evaluations/[id]/summary, training-plan, training-plan/[id], training-plan/summary, hrdf, team-building, vote, support, reviews, messages

/api/ai/recommend                  # AI-powered program recommendations

/api/auth/login, logout, me
```

---

## 📝 Seed Data

- **6 Companies:** Petronas ICT, Maybank, Top Glove, AirAsia, Telekom Malaysia, Sime Darby
- **10 Users:** 1 Admin, 3 Trainers, 6 HR (one per company)
- **12 Published Programs** across all categories
- **72+ Employees** across 6 companies
- **23 Bookings** (12 completed, 6 confirmed, 5 pending)
- **19 Training Plan Items** (Petronas: 16, Maybank: 3) — across draft/matched/scheduled
- **12 Evaluations** with full response data
- **18 Invoices**, reviews, messages
- **6 Support tickets** across categories
- **7 Changelog entries**, 8 program itineraries
- Attendance records, leaves, claims, trainer availability

---

Built with ❤️ for Malaysian HR professionals.
