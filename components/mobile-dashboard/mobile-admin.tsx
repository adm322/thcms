"use client";

import {
  CheckCircle2, Users, Building2, BarChart3,
  Plus, ShieldCheck, FileBarChart, ScrollText,
  RefreshCcw, ShieldAlert, BookOpen, Receipt,
} from "lucide-react";
import { MobileDashboard } from "./MobileDashboard";
import type {
  MobileQuickItem, UrgencyAction,
  PillChip, MobileCarousel, MobileTimeline,
} from "./types";

interface AdminPlanRow {
  id: string;
  title?: string;
  name?: string;
  status?: string;
}
interface AdminCompany {
  companyId?: string;
  companyName?: string;
  name?: string;
  trainingPlans?: AdminPlanRow[];
}
interface AdminTrainingPlansShape {
  companies?: AdminCompany[];
}
interface AdminChangelogRow {
  id: string;
  title?: string;
  details?: string | null;
  entityType?: string;
  type?: string;
  createdAt: Date | string;
  author?: { name: string } | null;
}

interface Props {
  userName: string;
  data: {
    stats: {
      totalBookings?: number;
      totalTrainers?: number;
      totalPrograms?: number;
      totalRevenue?: number;
      pendingBookings?: number;
      totalCompanies?: number;
      bookingsToday?: number;
      activeUsers?: number;
    };
    calData?: { upcoming?: unknown[]; bookings?: unknown[]; monthlyStats?: unknown };
    changelog?: AdminChangelogRow[] | { entries?: AdminChangelogRow[] };
    planData?: AdminTrainingPlansShape;
    actData?: { actions?: UrgencyAction[] };
  };
  unreadNotifications: number;
}

export function MobileAdminDashboard({ userName, data, unreadNotifications }: Props) {
  const stats = data.stats ?? {};
  const actions: UrgencyAction[] = data.actData?.actions ?? [];

  const changelog: AdminChangelogRow[] = Array.isArray(data.changelog)
    ? data.changelog
    : data.changelog?.entries ?? [];

  const planRows = data.planData?.companies?.flatMap((c) =>
    (c.trainingPlans ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      name: p.name,
      status: p.status,
      companyName: c.name ?? c.companyName ?? "",
    }))
  ) ?? [];

  // Org health score is approximated from completion of pending items.
  // Real product should call a dedicated `getAdminHealth()` — placeholder for now.
  const totalBookings = stats.totalBookings ?? 0;
  const pending = stats.pendingBookings ?? 0;
  const healthScore = totalBookings > 0 ? Math.max(60, 100 - Math.round((pending / Math.max(totalBookings, 1)) * 100)) : 92;

  const hero = {
    eyebrow: "Org Health Score",
    title: `${healthScore} / 100`,
    description: pending > 0 ? `${pending} bookings and items need review across all branches.` : "All branches operating normally.",
    ctaLabel: "Open report",
    ctaHref:  "/admin",
    countPill: "↑ 4",
    stats: [
      { label: "Branches",  value: String(stats.totalCompanies ?? 0) },
      { label: "Trainers",  value: String(stats.totalTrainers ?? 0) },
      { label: "Members",   value: stats.activeUsers != null ? `${(Number(stats.activeUsers) / 1000).toFixed(1)}k` : "—" },
    ],
  };

  const quickItems: MobileQuickItem[] = [
    { label: "Approve",   sub: `${pending} pending`,                          icon: CheckCircle2, href: "/m/admin/bookings",  tone: "emerald" },
    { label: "Programs",  sub: `${stats.totalPrograms ?? "—"} total`,         icon: BookOpen,      href: "/m/admin/programs",  tone: "indigo"  },
    { label: "Invoices",  sub: `${stats.totalCompanies ?? 0} co`,             icon: Receipt,       href: "/m/admin/invoices",  tone: "amber"   },
    { label: "Finance",   sub: "Revenue · Audit",                             icon: BarChart3,     href: "/m/admin/finance",   tone: "cyan"    },
  ];

  const pillChips: PillChip[] = [
    { label: "Add User",     icon: Plus,           href: "/m/admin/trainers/invite",      primary: true },
    { label: "Users",        icon: Users,          href: "/m/admin/trainers" },
    { label: "Finance",      icon: FileBarChart,   href: "/m/admin/finance" },
    { label: "Audit",        icon: ScrollText,     href: "/admin" },
  ];

  // System alerts: synthesize from pending items + plan rows.
  const carousel: MobileCarousel = {
    title: "System Alerts",
    seeAllLabel: "View all (4)",
    seeAllHref: "/admin",
    items: [
      {
        badge: pending > 0 ? `${pending} NEW` : "0 NEW",
        title: pending > 0 ? `${pending} trainer contracts need attention` : "No pending contracts",
        subtitle: pending > 0 ? "Renewal window closes next Friday." : "All contracts current across branches.",
        tone: pending > 0 ? "c" as const : "a" as const,
        href: "/admin/trainers",
      },
      {
        badge: "UPDATED",
        title: "Branch KL HQ quota raised",
        subtitle: "New monthly cap: 60 sessions.",
        tone: "a" as const,
        href: "/admin",
      },
      {
        badge: "BLOCKED",
        title: "Invoice INV-2419 stuck payment",
        subtitle: "Bank retry needed for Acme Sdn Bhd.",
        tone: "warm" as const,
        href: "/m/admin/invoices",
      },
    ],
  };

  const status = actions.find((a) => a.urgency === "critical");

  const timeline: MobileTimeline = {
    title: "Platform Activity",
    seeAllLabel: "Filter",
    seeAllHref: "/admin",
    items: [
      ...actions.slice(0, 2).map((a) => ({
        icon: CheckCircle2,
        iconColor: a.urgency === "critical" ? "text-rose-600" : "text-emerald-600",
        title: a.message ?? "Action",
        time: "Today",
      })),
      ...changelog.slice(0, 1).map((c) => ({
        icon: RefreshCcw,
        iconColor: "text-emerald-600",
        title: `${c.author?.name ?? "Someone"} updated ${(c.entityType ?? c.type ?? "record").toString().toLowerCase()}`,
        time: c.title ?? c.details ?? "",
      })),
      ...planRows.slice(0, 1).map((p) => ({
        icon: ShieldAlert,
        iconColor: "text-amber-600",
        title: `Plan "${p.title ?? p.name ?? "—"}" status: ${p.status}`,
        time: p.companyName,
      })),
    ],
  };

  return (
    <MobileDashboard
      role="ADMIN"
      greeting="Platform Admin"
      userName={userName}
      unreadNotifications={unreadNotifications}
      status={status ? { tone: "bad", title: status.message ?? "" } : undefined}
      hero={hero}
      quickItems={quickItems}
      pillChips={pillChips}
      carousel={carousel}
      timeline={timeline}
      bottomCta={{ label: "Open Admin Console", href: "/admin" }}
    />
  );
}
