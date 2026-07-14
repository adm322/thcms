"use client";

/**
 * Shared types for the mobile dashboard. Defined as `unknown[]`/`Record<...>`
 * rather than `any` to satisfy the repo's no-explicit-any lint rule while
 * still matching the data shapes each role's API actually returns.
 */

import type { LucideIcon } from "lucide-react";

// ─── Role / brand ────────────────────────────────────────────────────────────

export type MobileRole = "ADMIN" | "TRAINER" | "HR" | "PARTICIPANT";

/** Brand palette per role — set on the dashboard root as CSS vars */
export interface Brand {
  /** Primary accent hex (used for hero gradient start, tile icon, active tab) */
  hex: string;
  /** Deep hex for gradient end / shadows */
  deep: string;
  /** Soft hex for active-tile background */
  soft: string;
  /** Tailwind class for the FAB gradient (informational; CSS var does the work) */
  label: string;
}

export const BRAND: Record<MobileRole, Brand> = {
  HR:          { hex: "#ff5a1f", deep: "#d83b00", soft: "#fff1ea", label: "red-orange" },
  ADMIN:       { hex: "#8b5cf6", deep: "#6d28d9", soft: "#f3e8ff", label: "purple"     },
  TRAINER:     { hex: "#10c46c", deep: "#059669", soft: "#d1fae5", label: "green"      },
  PARTICIPANT: { hex: "#0ea5e9", deep: "#0369a1", soft: "#e0f2fe", label: "blue"       },
};

/**
 * Shared Tailwind class strings for booking + attendance status pills.
 * Replaces the dozens of duplicated `STATUS_TONE` maps previously inlined
 * in every mobile page.
 */
export const BOOKING_STATUS_TONE: Record<string, string> = {
  PENDING:   "bg-amber-100  text-amber-900",
  CONFIRMED: "bg-emerald-100 text-emerald-900",
  COMPLETED: "bg-sky-100    text-sky-900",
  CANCELLED: "bg-rose-100   text-rose-900",
};

export const ATTENDANCE_TONE: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-900",
  ABSENT:  "bg-rose-100   text-rose-900",
  PENDING: "bg-amber-100  text-amber-900",
};

export const ATTENDANCE_LABEL: Record<string, string> = {
  PRESENT: "Present",
  ABSENT:  "Absent",
  PENDING: "Pending",
};

// ─── Urgency / hero / list ───────────────────────────────────────────────────

export type UrgencyTone = "ok" | "warn" | "bad" | "neutral";

export interface UrgencyAction {
  type?: string | null;
  urgency: "critical" | "urgent" | "soon" | "info" | string;
  message?: string | null;
  action?: string | null;
  link?: string | null;
}

export interface UpcomingBooking {
  id: string;
  programTitle: string;
  companyName: string;
  date: string;
}

export interface MobileActionItem {
  icon?: LucideIcon;
  badge?: string;
  tone?: UrgencyTone;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  href?: string;
}

export interface MobileQuickItem {
  label: string;
  sub?: string;
  icon: LucideIcon;
  href: string;
  tone?: "indigo" | "cyan" | "amber" | "rose" | "emerald";
}

export interface MobileHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Hero stat row (3 small KPIs) */
  stats?: { label: string; value: string }[];
  /** "count" pill inline next to title (e.g., a "2 NEW" badge) */
  countPill?: string;
}

export interface MobileStatus {
  tone: "warn" | "bad" | "ok";
  title: string;
  subtitle?: string;
}

// ─── New v3 sections ─────────────────────────────────────────────────────────

export interface PillChip {
  label: string;
  icon?: LucideIcon;
  href?: string;
  /** When true, applies the brand gradient — the primary chip in the row */
  primary?: boolean;
}

export interface CarouselItem {
  badge: string;
  title: string;
  subtitle: string;
  /** Optional left-side emoji/icon (rendered as small text glyph) */
  glyph?: string;
  /** Tailwind gradient class (e.g., 'from-emerald-50 to-emerald-100 text-emerald-900') */
  tone?: "a" | "b" | "c" | "warm";
  href?: string;
}

export interface MobileCarousel {
  title: string;
  seeAllLabel?: string;
  seeAllHref?: string;
  items: CarouselItem[];
}

export interface TimelineItem {
  icon?: LucideIcon;
  iconColor?: string; // tailwind text-* class, e.g. "text-emerald-500"
  title: string;
  time?: string;
  /** Optional status pill shown on the right (e.g. "Present" / "Missed") */
  badge?: {
    label: string;
    tone?: "ok" | "warn" | "bad" | "neutral";
  };
}

export interface MobileTimeline {
  title: string;
  seeAllLabel?: string;
  seeAllHref?: string;
  items: TimelineItem[];
}

// ─── Scan hero (Participant) ─────────────────────────────────────────────────

export interface ScanHeroProps {
  eyebrow: string;
  /** Big heading above the scan CTA */
  title: string;
  ctaLabel: string;
  ctaHref: string;
  hint?: string;
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  isFab?: boolean;
  /** Optional badge count displayed on the tab */
  badge?: number;
}

// ─── Tone maps ───────────────────────────────────────────────────────────────

export const URGENCY_TONE: Record<string, UrgencyTone> = {
  critical: "bad",
  urgent: "warn",
  soon: "ok",
  info: "neutral",
};

export const URGENCY_BADGE_TEXT: Record<string, string> = {
  critical: "!",
  urgent: "!",
  soon: "→",
  info: "·",
};

// Carousel tone → tailwind gradient
export const CAROUSEL_TONE: Record<NonNullable<CarouselItem["tone"]>, { bg: string; text: string; badge: string }> = {
  a:    { bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",     text: "text-emerald-900",    badge: "bg-emerald-900/10 text-emerald-900" },
  b:    { bg: "bg-gradient-to-br from-sky-50 to-sky-100",             text: "text-sky-900",         badge: "bg-sky-900/10 text-sky-900" },
  c:    { bg: "bg-gradient-to-br from-fuchsia-50 to-fuchsia-100",     text: "text-fuchsia-900",     badge: "bg-fuchsia-900/10 text-fuchsia-900" },
  warm: { bg: "bg-gradient-to-br from-orange-50 to-orange-100",       text: "text-orange-900",      badge: "bg-orange-900/10 text-orange-900" },
};
