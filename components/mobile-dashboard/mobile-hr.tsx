"use client";

import {
  Calendar, UserPlus, Sparkles,
  Plus, Bot, FileText, Settings as SettingsIcon,
  Store, MessageCircle, ClipboardCheck,
} from "lucide-react";
import {
  MobileDashboard,
} from "./MobileDashboard";
import type {
  MobileQuickItem, UrgencyAction,
  PillChip, MobileCarousel,
} from "./types";

interface HrStats {
  totalEmployees?: number;
  totalBookings?: number;
  completedBookings?: number;
  pendingBookings?: number;
  totalSpent?: number;
  recentBookings?: { id: string; programTitle: string; category: string; date: string; status: string; fee: number }[];
  categoryBreakdown?: { category: string; count: number }[];
}

interface Props {
  userName: string;
  data: {
    stats: HrStats;
    actData?: { actions?: UrgencyAction[] };
    aiRecs?: {
      /** AI-suggested programs — shape matches GET /api/ai/recommend response */
      recommendedPrograms?: { id: string; title: string; category: string }[];
    };
  };
  unreadNotifications: number;
}

export function MobileHRDashboard({ userName, data, unreadNotifications }: Props) {
  const stats = data.stats ?? {};
  const actions: UrgencyAction[] = data.actData?.actions ?? [];
  const recs = data.aiRecs?.recommendedPrograms ?? [];

  // Map API field names to mobile semantic names:
  //   totalEmployees  → employees
  //   completedBookings → active (classes already completed this period)
  //   pendingBookings  → in-queue (confirmed + pending = upcoming/active)
  //   totalBookings    → total (for completion rate)
  const employeesCount    = stats.totalEmployees    ?? 0;
  const activeCount       = stats.completedBookings ?? 0;
  const pendingCount      = stats.pendingBookings    ?? 0;
  const completionRate     = stats.totalBookings && stats.totalBookings > 0
    ? Math.round((stats.completedBookings ?? 0) / stats.totalBookings * 100)
    : 0;

  const hero = {
    eyebrow: pendingCount > 0 ? "Action needed" : "Up next",
    title: pendingCount > 0
      ? `${pendingCount} ${pendingCount === 1 ? "thing needs" : "things need"} your attention`
      : "Review your team's bookings",
    description: pendingCount > 0
      ? "Pending roster confirmations for this week."
      : `${pendingCount} classes confirmed this week`,
    ctaLabel: pendingCount > 0 ? "Open queue" : "Open calendar",
    ctaHref:  "/m/hr/calendar",
    countPill: pendingCount > 0 ? `${Math.min(pendingCount, 9)} NEW` : undefined,
    stats: [
      { label: "Employees", value: String(employeesCount) },
      { label: "Active",    value: String(activeCount) },
      { label: "Completion", value: `${completionRate}%` },
    ],
  };

  const quickItems: MobileQuickItem[] = [
    { label: "Schedule",    sub: `${pendingCount} upcoming`, icon: Calendar,    href: "/m/hr/calendar",        tone: "amber"   },
    { label: "Add Trainer", sub: "Onboard",                   icon: UserPlus,   href: "/m/hr/employees/new",  tone: "indigo"  },
    { label: "AI Help",     sub: "Ask anything",              icon: Sparkles,   href: "/ai-helper",            tone: "rose"    },
  ];

  const pillChips: PillChip[] = [
    { label: "New Booking", icon: Plus,         href: "/m/hr/new-booking", primary: true },
    { label: "Marketplace",  icon: Store,        href: "/m/hr/marketplace" },
    { label: "Messages",     icon: MessageCircle, href: "/m/hr/messages" },
    { label: "Evaluations",  icon: ClipboardCheck, href: "/m/hr/evaluations" },
    { label: "AI Assist",    icon: Bot,          href: "/ai-helper" },
    { label: "Employees",    icon: FileText,     href: "/m/hr/employees" },
    { label: "Settings",     icon: SettingsIcon, href: "/settings" },
  ];

  const carousel: MobileCarousel = {
    title: "For You ✨",
    seeAllLabel: "See all",
    seeAllHref: "/ai-helper",
    items: [
      ...recs.slice(0, 2).map((p) => ({
        badge: "SMART MATCH",
        title: p.title ?? "Recommended training",
        subtitle: `Category · ${p.category ?? "General"}`,
        tone: "b" as const,
        href: `/class/${p.id}`,
      })),
      {
        badge: "TIP",
        title: "Auto-approve returning clients",
        subtitle: "Cut 4 hours of admin per week.",
        tone: "c" as const,
        href: "/settings/automation",
      },
    ].filter(Boolean),
  };

  const status = actions.find((a) => a.urgency === "critical" || a.urgency === "urgent");

  return (
    <MobileDashboard
      role="HR"
      greeting="Welcome back"
      userName={userName}
      unreadNotifications={unreadNotifications}
      status={status ? { tone: "warn", title: status.message ?? "" } : undefined}
      hero={hero}
      quickItems={quickItems}
      pillChips={pillChips}
      carousel={carousel}
      bottomCta={{ label: "View All Bookings", href: "/m/hr/calendar" }}
    />
  );
}
