# TrainHub Malaysia — HR & Training Development Platform

> Full-stack Next.js 16 application connecting HR departments with training vendors across Malaysia.

## What It Does

TrainHub is a two-sided platform:
- **HR Departments** browse programs, book training, manage employees, run evaluations, plan annual training budgets
- **Training Vendors** publish programs, build quizzes, manage availability, track earnings
- **Platform Admin** oversees bookings, approves training plans, tracks invoices

## Quick Start

```bash
npm install
npx prisma generate
npx prisma db push --force-reset --accept-data-loss
npx tsx prisma/seed.ts
npm run dev -- --webpack
```

Open **http://localhost:3000**

## Demo Accounts

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

## Feature Highlights

### For HR Teams
- **Training Planner** — Annual budget bar, smart calendar (Q1-Q4 with Malaysian public holidays), pipeline kanban (5 stages with tooltips), one-click booking to marketplace
- **Program Marketplace** — Browse with category filters, thumbnails, pricing, and booking flow
- **Team Building Planner** — 4-step wizard with 12 activities, 10 venues, HRDF calculations, admin approval workflow
- **Employee Management** — Records with department/position, bulk CSV upload
- **Evaluations** — Post-training feedback with performance graphs, QR codes, PDF export
- **HRDF Calculator** — Malaysian ACM rates with live cost breakdown
- **SOP Guide** — 4-tab guide (Overview, HR SOP, Training Admin SOP, Vendor SOP) with Malaysian HRDF compliance
- **Messages Inbox** — Split-pane chat with trainers
- Leave management, attendance tracking, claims management
- Vote & Request, Support Tickets, AI recommendations
- **📱 Mobile view** — Full-featured mobile dashboard at `/m` with employee management, booking wizard, calendar, and QR code display

### For Training Vendors
- **Program Builder** — 3-step wizard to create programs with modules, quizzes, materials
- **Quiz Builder** — MCQs, True/False, Short Answer per module
- **Availability Calendar** — Toggle days available/unavailable, synced across admin and HR views
- **Messages Inbox** — Chat with HR departments
- **Earnings Dashboard** — Revenue tracking with breakdown
- **Smart Actions** — Upcoming training alerts, HRDF claim deadlines, zero-booking program warnings
- **📱 Mobile view** — Program management, availability, earnings, and evaluations on mobile

### For Platform Admins
- **Training Plans Oversight** — All-company view, approve/reject with reasons, add notes for HR
- **Training Calendar** — Month/year views, color-coded by category, event click details
- **Booking Management** — Training checklist (15 items), dual-party HRDF tracking
- **Team Building Review** — Approve/reject requests with documents, HRDF tracking
- Invoices, trainer directory, support tickets
- Trainer invite flow with temp password generation
- Sales & Finance dashboards with Recharts
- Featured programs, changelog
- **📱 Mobile view** — Bookings, programs, trainers, invoices, finance, and trainer invite wizard

### For Participants
- **Dashboard** — Upcoming classes, completed hours, quiz scores, certificates earned
- **QR Scanner** — Scan to check in to classes
- **Class detail** — Program info, modules, quiz access
- **📱 Mobile-first** — `/m/participant` with full app-shell experience

## Tech Stack
Next.js 16.2 • React 19 • TypeScript • Tailwind CSS v4 • shadcn/ui base-nova • Prisma 7 • SQLite • JWT (jose) • Recharts • jspdf • qrcode

## Architecture
- **Desktop dashboard** at `/admin`, `/trainer`, `/hr`, `/participant` — sidebar layout with Vercel-inspired design
- **Mobile dashboard** at `/m` — full-screen app shell with role-specific views, bypasses desktop sidebar
- **Shared service layer** at `lib/services/` — data-fetching functions shared by API routes and pages (admin, hr, trainer services)
- **Wizard component library** at `components/wizard/` — reusable stepper + navigation used by 4 mobile forms
- **Login view selector** — users choose mobile or desktop dashboard at login, persisted in localStorage
