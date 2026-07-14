"use client";

/**
 * Participant mobile dashboard — scan-first.
 *
 * Design differences from HR/Trainer/Admin:
 *  - No gradient hero. The very first card is the **Scan Hero** (dark
 *    participant-blue panel with a giant white "Scan QR to Check-In" button).
 *  - Bottom dock FAB renders the QrCode icon (not Plus) — so the camera is
 *    the prominent permanent CTA in the user's peripheral vision.
 *  - Timeline is replaced/augmented with **Recent Check-Ins** showing
 *    "Present" / "Missed" status pills so the participant sees their gaps.
 */

import * as React from "react";
import {
  BookOpen, Award, Globe,
  QrCode, MessageSquare, Star, Plus,
  CalendarClock,
} from "lucide-react";
import { MobileDashboard } from "./MobileDashboard";
import type {
  MobileQuickItem,
  PillChip, MobileCarousel, MobileTimeline,
} from "./types";

interface ParticipationRecord {
  id: string;
  bookingId?: string;
  attendanceStatus?: "PENDING" | "PRESENT" | "ABSENT" | string;
  programTitle?: string;
  programDate?: Date | string;
  programCategory?: string;
}

interface Props {
  userName: string;
  data: {
    participations?: ParticipationRecord[];
    /** Aggregate stats pre-computed server-side. */
    stats?: {
      totalHours?: number;
      completedCount?: number;
      certificatesEarned?: number;
      avgQuizScore?: number | null;
      upcomingCount?: number;
    };
  };
  unreadNotifications: number;
}

export function MobileParticipantDashboard({ userName, data, unreadNotifications }: Props) {
  const participations = data.participations ?? [];
  const stats = data.stats ?? {};

  const upcoming = participations.filter((p) => p.attendanceStatus === "PENDING");
  const completed = participations.filter((p) => p.attendanceStatus === "PRESENT");
  const next = upcoming[0];

  // ─── Live countdown tick for next session ──────────────────────────────────
  // Lazy-init: compute initial value without triggering setState in effect.
  const [minsUntil, setMinsUntil] = React.useState<number | null>(() =>
    next?.programDate ? minutesUntil(next.programDate) : null,
  );

  // Only manage the interval in the effect — no direct setState at mount.
  React.useEffect(() => {
    if (!next?.programDate) return;
    const tick = () => setMinsUntil(minutesUntil(next.programDate!));
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [next?.programDate]);

  // ─── Scan hero ─────────────────────────────────────────────────────────────
  const nextTime = next?.programDate
    ? new Date(next.programDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;
  const nextDate = next?.programDate
    ? new Date(next.programDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    : null;

  const scanHero = {
    eyebrow: next ? `TODAY · ${nextTime ?? nextDate}` : "ATTENDANCE",
    title: next
      ? minsUntil === null
        ? `${next.programTitle ?? "Your next class"}`
        : minsUntil <= 0
        ? `${next.programTitle ?? "Your next class"} starting now`
        : `${next.programTitle ?? "Your next class"} starts in ${minsUntil} min`
      : "Scan the room QR to check in",
    ctaLabel: "Scan QR to Check-In",
    ctaHref: "/m/participant/scan",
    hint: "Point your camera at the room QR code · works offline",
  };

  // ─── Quick tiles ───────────────────────────────────────────────────────────
  const quickItems: MobileQuickItem[] = [
    { label: "Bookings",  sub: `${upcoming.length} upcoming`,                 icon: BookOpen,        href: "/m/participant",            tone: "cyan"   },
    { label: "Certs",     sub: `${stats.certificatesEarned ?? 0} earned`,  icon: Award,           href: "/m/participant",            tone: "amber"  },
    { label: "Calendar",  sub: "My schedule",                                icon: CalendarClock,   href: "/m/participant",            tone: "indigo" },
    { label: "Browse",    sub: "Find training",                             icon: Globe,           href: "/m/participant",            tone: "emerald"},
  ];

  // ─── Pill chips ────────────────────────────────────────────────────────────
  const pillChips: PillChip[] = [
    { label: "Scan Again",       icon: QrCode,        href: "/m/participant/scan", primary: true },
    { label: "Submit Feedback",   icon: MessageSquare, href: "/m/participant" },
    { label: "Rate Trainer",      icon: Star,          href: "/m/participant" },
    { label: "Request Training",   icon: Plus,          href: "/m/participant" },
  ];

  // ─── Upcoming classes carousel ────────────────────────────────────────────
  const carousel: MobileCarousel = {
    title: "Upcoming Classes",
    seeAllLabel: "All bookings",
    seeAllHref: "/m/participant",
    items: upcoming.slice(0, 4).map((p) => {
      const t = p.programDate ? new Date(p.programDate) : null;
      const time = t?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) ?? "";
      const day  = t?.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) ?? "";
      return {
        badge: t ? `${day.toUpperCase()} · ${time}` : "UPCOMING",
        title: p.programTitle ?? "Class",
        subtitle: `${p.programCategory ?? "Workshop"} · ${time}`,
        tone: "b" as const,
        href: p.bookingId ? `/m/participant/class/${p.bookingId}` : "/m/participant",
      };
    }),
  };

  // ─── Recent check-ins timeline (status pills) ─────────────────────────────
  const recentItems = [...upcoming.slice(0, 1), ...completed].slice(0, 4);
  const timeline: MobileTimeline = {
    title: "Recent Check-Ins",
    seeAllLabel: "All activity",
    seeAllHref: "/m/participant",
    items: recentItems.map((p) => {
      const t = p.programDate ? new Date(p.programDate) : null;
      const timeStr = t
        ? t.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
        : "—";
      return {
        icon: QrCode,
        iconColor: p.attendanceStatus === "PRESENT" ? "text-emerald-600" : p.attendanceStatus === "ABSENT" ? "text-rose-600" : "text-sky-600",
        title: p.programTitle ?? "Class",
        time: timeStr,
        badge: p.attendanceStatus === "PRESENT"
          ? { label: "Present", tone: "ok" }
          : p.attendanceStatus === "ABSENT"
          ? { label: "Missed",  tone: "warn" }
          : { label: "Pending", tone: "neutral" },
      };
    }),
  };

  return (
    <MobileDashboard
      role="PARTICIPANT"
      greeting="My Learning"
      userName={userName}
      unreadNotifications={unreadNotifications}
      scanHero={scanHero}
      quickItems={quickItems}
      pillChips={pillChips}
      carousel={carousel}
      timeline={timeline}
      bottomCta={{ label: "Open My Classes", href: "/m/participant" }}
    />
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function minutesUntil(dateLike: string | Date): number {
  const diff = new Date(dateLike).getTime() - Date.now();
  if (Number.isNaN(diff)) return 0;
  return Math.max(0, Math.round(diff / 60000));
}
