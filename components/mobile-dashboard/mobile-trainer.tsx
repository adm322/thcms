"use client";

import {
  ScanLine, Wallet, ClipboardCheck, Star, Plus,
  CalendarRange, MessageSquare, CalendarClock,
  CheckCircle2, DollarSign, Star as StarIcon,
} from "lucide-react";
import { MobileDashboard } from "./MobileDashboard";
import type {
  MobileQuickItem, UpcomingBooking, UrgencyAction,
  PillChip, MobileCarousel, MobileTimeline,
} from "./types";

interface Props {
  userName: string;
  data: {
    stats: {
      totalPrograms?: number;
      publishedPrograms?: number;
      draftPrograms?: number;
      totalBookings?: number;
      totalRevenue?: number;
      averageRating?: number;
      totalPax?: number;
      upcomingBookings?: UpcomingBooking[];
    };
    actData?: { actions?: UrgencyAction[] };
    evals?: { evaluations?: { id: string; title: string; programTitle: string; companyName: string; summaryScore: number; completedAt: string | null }[] };
  };
  unreadNotifications: number;
}

export function MobileTrainerDashboard({ userName, data, unreadNotifications }: Props) {
  const stats = data.stats ?? {};
  const actions: UrgencyAction[] = data.actData?.actions ?? [];
  const upcoming: UpcomingBooking[] = stats.upcomingBookings ?? [];

  const sessionsToday = upcoming
    .filter((b) => new Date(b.date).toDateString() === new Date().toDateString())
    .length;

  const hero = {
    eyebrow: "Today",
    title: sessionsToday > 0
      ? `${sessionsToday} session${sessionsToday === 1 ? "" : "s"} · ${Math.max(upcoming.length - sessionsToday, 0)} next`
      : "No sessions today",
    description: sessionsToday > 0
      ? "Two upcoming · check in opens 15 min before."
      : "A great day to publish a new program.",
    ctaLabel: "Open schedule",
    ctaHref:  "/m/trainer/calendar",
    countPill: stats.totalRevenue != null && stats.totalRevenue > 0
      ? `RM ${Number(stats.totalRevenue).toLocaleString()}`
      : undefined,
    stats: [
      { label: "Pax",       value: String(stats.totalPax ?? 0) },
      { label: "Rating",    value: stats.averageRating ? stats.averageRating.toFixed(1) + "★" : "—" },
      { label: "This Wk",   value: stats.totalRevenue != null ? `RM ${Number(stats.totalRevenue).toLocaleString()}` : "—" },
    ],
  };

  const quickItems: MobileQuickItem[] = [
    { label: "Check-In",  sub: "Open camera",                                               icon: ScanLine,       href: "/m/trainer/calendar",        tone: "cyan"   },
    { label: "Earnings",   sub: stats.totalRevenue != null ? `RM ${Number(stats.totalRevenue).toLocaleString()}` : "RM 0", icon: Wallet, href: "/m/trainer/earnings",      tone: "emerald" },
    { label: "Materials",  sub: `${stats.totalPrograms ?? 0} files`,                         icon: ClipboardCheck, href: "/m/trainer/programs",      tone: "indigo"  },
    { label: "Reviews",    sub: stats.averageRating ? `${stats.averageRating.toFixed(1)}★ avg` : "—",         icon: Star,    href: "/m/trainer/evaluations",   tone: "amber"  },
  ];

  const pillChips: PillChip[] = [
    { label: "New Program",  icon: Plus,          href: "/m/trainer/programs/new", primary: true },
    { label: "Availability", icon: CalendarRange, href: "/m/trainer/availability" },
    { label: "Ask Review",   icon: MessageSquare, href: "/m/trainer/evaluations" },
    { label: "Reschedule",   icon: CalendarClock, href: "/m/trainer/calendar" },
  ];

  const carousel: MobileCarousel = {
    title: "Today's Sessions",
    seeAllLabel: "View calendar",
    seeAllHref: "/m/trainer/calendar",
    items: upcoming.slice(0, 4).map((b) => {
      const time = new Date(b.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const day  = new Date(b.date).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" });
      return {
        badge: `${time} · ${b.companyName}`,
        title: b.programTitle,
        subtitle: `${day} · ${b.companyName}`,
        tone: "b" as const,
        href: `/m/trainer/bookings/${b.id}`,
      };
    }),
  };

  const status = actions.find((a) => a.urgency === "critical" || a.urgency === "urgent");

  const timeline: MobileTimeline = {
    title: "Recent Activity",
    seeAllLabel: "All",
    seeAllHref: "/m/trainer/evaluations",
    items: [
      { icon: CheckCircle2, iconColor: "text-emerald-600", title: "Onboarding 101 — 18/18 attended",      time: "2h ago" },
      { icon: DollarSign,   iconColor: "text-amber-600",   title: "Payout RM 1,240 credited",              time: "Yesterday" },
      { icon: StarIcon,     iconColor: "text-rose-600",    title: "5★ review from Lina (Compliance)",     time: "2d ago" },
    ],
  };

  return (
    <MobileDashboard
      role="TRAINER"
      greeting="Good morning"
      userName={userName}
      unreadNotifications={unreadNotifications}
      status={status ? { tone: "warn", title: status.message ?? "" } : undefined}
      hero={hero}
      quickItems={quickItems}
      pillChips={pillChips}
      carousel={carousel}
      timeline={timeline}
      bottomCta={{ label: "Open Schedule", href: "/m/trainer/calendar" }}
    />
  );
}
