# TrainHub Malaysia — HR & Training Development Platform

> Full-stack Next.js 16 application connecting HR departments with training vendors across Malaysia.

## What It Does

TrainHub is a two-sided platform:
- **HR Departments** browse programs, book training, manage employees, run evaluations, plan annual training budgets
- **Training Vendors** publish programs, build quizzes, manage availability, track earnings
- **Platform Admin** oversees bookings, approves training plans, manages reimbursements, tracks invoices

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

### For Training Vendors
- **Program Builder** — 3-step wizard to create programs with modules, quizzes, materials
- **Quiz Builder** — MCQs, True/False, Short Answer per module
- **Availability Calendar** — Toggle days available/unavailable, synced across admin and HR views
- **Messages Inbox** — Chat with HR departments
- **Earnings Dashboard** — Revenue tracking with breakdown
- **Smart Actions** — Upcoming training alerts, HRDF claim deadlines, zero-booking program warnings

### For Platform Admins
- **Training Plans Oversight** — All-company view, approve/reject with reasons, add notes for HR
- **Training Calendar** — Month/year views, color-coded by category, event click details
- **Booking Management** — Training checklist (15 items), dual-party HRDF tracking
- **Team Building Review** — Approve/reject requests with documents, HRDF tracking
- Reimbursements, invoices, trainer directory, support tickets
- Sales & Finance dashboards with Recharts
- Featured programs, changelog

## Tech Stack
Next.js 16.2 • React 19 • TypeScript • Tailwind CSS v4 • shadcn/ui • Prisma 7 • SQLite • JWT (jose) • Recharts • jspdf • qrcode

## Database
24 Prisma models — Users, Companies, Programs, Modules, Quizzes, Questions, Materials, Bookings, Participants, Evaluations, Invoices, Reimbursements, Employees, Leaves, Attendance, Claims, Payroll, Messages, Reviews, ProgramVotes, SupportTickets, Changelog, TeamBuildingRequests, TrainerAvailabilities, TrainingPlanItems

## Seed Data
6 companies, 10 users, 12 programs, 72+ employees, 23 bookings, 19 training plan items, 12 evaluations, 18 invoices — full realistic Malaysian HR data
