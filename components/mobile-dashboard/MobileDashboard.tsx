"use client";

/**
 * Mobile dashboard — v3 super-app layout (TNG / CelcomDigi DNA).
 *
 * Layout anatomy (top → bottom):
 *   1. Top bar          — greeting + notification bell w/ unread dot
 *   2. Hero             — gradient card with brand color, eyebrow, title, count pill,
 *                         3-stat row, primary CTA pill
 *   2b. Scan hero       — (Participant only) replaces the gradient hero with a dark
 *                         scan-first panel + giant "Scan QR" button
 *   3. Quick grid       — 4-tile outlined square grid, brand-tinted icons
 *   4. Pill chips       — horizontal scrollable pill row, primary one filled
 *   5. Plans carousel   — horizontal snap-scroll card list, color-coded by tone
 *   6. Activity timeline — card-style vertical list with timeline rail
 *   7. Bottom CTA       — full-width brand gradient pill
 *   8. Bottom dock      — fixed 5-column grid: 2 tabs | FAB | 2 tabs; FAB icon
 *                         is role-driven (Plus for HR/Admin/Trainer, QrCode for
 *                         Participant so the camera is the prominent CTA)
 *
 * Each variant wrapper (mobile-hr / mobile-trainer / mobile-admin /
 * mobile-participant) supplies its own hero, scan hero (optional), quick items,
 * pill chips, carousel, timeline, bottom CTA, and dock. Everything flows
 * through this shell so the chrome stays consistent across the four roles —
 * the only things that vary are brand color, content, and (for Participant)
 * the FAB icon and scan-first positioning.
 */

import * as React from "react";
import Link from "next/link";
import {
  Bell, AlertTriangle, Plus, Home, Calendar, User, QrCode, Users,
  ArrowRight, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  BRAND, CAROUSEL_TONE,
  type MobileRole, type Brand,
  type MobileQuickItem,
  type MobileHeroProps, type MobileStatus,
  type PillChip, type MobileCarousel, type MobileTimeline,
  type ScanHeroProps, type NavItem, type CarouselItem,
  type UrgencyTone,
} from "./types";

const TONE_BG: Record<UrgencyTone, string> = {
  ok:      "bg-emerald-100 text-emerald-800",
  warn:    "bg-amber-100 text-amber-800",
  bad:     "bg-rose-100 text-rose-800",
  neutral: "bg-slate-100 text-slate-700",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface MobileDashboardProps {
  role: MobileRole;
  greeting: string;
  userName: string;
  unreadNotifications?: number;
  status?: MobileStatus;

  /** Brand color — defaults to BRAND[role] when omitted */
  brand?: Brand;

  hero?: MobileHeroProps;
  /** Participant-only: dark scan-first hero. When provided, replaces `hero`. */
  scanHero?: ScanHeroProps;

  quickItems: MobileQuickItem[];
  /** Pill chip row — primary chip is filled with brand gradient */
  pillChips?: PillChip[];
  /** Plans / upcoming carousel */
  carousel?: MobileCarousel;
  /** Recent activity timeline */
  timeline?: MobileTimeline;
  /** Bottom full-width CTA */
  bottomCta?: { label: string; href: string };

  /** Bottom nav customization — defaults are role-aware below. */
  navItems?: NavItem[];
  /** Override the FAB icon (defaults to Plus; Participant uses QrCode) */
  fabIcon?: LucideIcon;
}

export function MobileDashboard(props: MobileDashboardProps) {
  const {
    role, greeting, userName, unreadNotifications = 0,
    status, brand,
    hero, scanHero, quickItems, pillChips, carousel, timeline, bottomCta,
    navItems, fabIcon,
  } = props;

  const b = brand ?? BRAND[role];
  const nav = navItems ?? defaultNav(role);
  const FabIcon = fabIcon ?? defaultFabIcon(role);

  // Inject brand colors as CSS vars on the root so the rest of the tree
  // can reference them via `style={{ color: "var(--brand)" }}` or
  // Tailwind arbitrary values like `text-[var(--brand)]`.
  const brandStyle: React.CSSProperties & Record<`--${string}`, string> = {
    "--brand":      b.hex,
    "--brand-deep": b.deep,
    "--brand-soft": b.soft,
  };

  return (
    <div
      className="min-h-dvh bg-[#f3f5f9] text-foreground pb-28"
      style={brandStyle}
      data-role={role.toLowerCase()}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-3 pb-3 bg-white border-b border-border">
        <div className="leading-tight">
          <div className="text-[11px] text-muted-foreground font-medium">{greeting}</div>
          <div className="text-[17px] font-bold tracking-tight">
            Hi, <span style={{ color: b.hex }}>{userName}</span> <span aria-hidden>👋</span>
          </div>
        </div>
        <Link
          href="/m/notifications"
          aria-label="Notifications"
          className="relative grid place-items-center size-10 rounded-full bg-white border border-border shadow-sm"
        >
          <Bell className="size-[18px]" />
          {unreadNotifications > 0 && (
            <span
              className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 grid place-items-center rounded-full bg-rose-500 text-white text-[9px] font-bold border-2 border-white"
              aria-label={`${unreadNotifications} unread`}
            >
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </Link>
      </header>

      <div className="px-4 pt-3 pb-6 space-y-1">
        {/* Status banner (warning/critical only) */}
        {status && (
          <div className={cn(
            "rounded-2xl border px-3.5 py-3 flex items-center gap-3",
            status.tone === "warn" && "border-amber-500/40 bg-amber-500/10",
            status.tone === "bad"  && "border-rose-500/40 bg-rose-500/10",
            status.tone === "ok"   && "border-emerald-500/40 bg-emerald-500/10",
          )}>
            <div className={cn(
              "grid place-items-center size-7 rounded-md text-white",
              status.tone === "warn" && "bg-amber-500",
              status.tone === "bad"  && "bg-rose-500",
              status.tone === "ok"   && "bg-emerald-500",
            )}>
              <AlertTriangle className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight">{status.title}</div>
              {status.subtitle && <div className="text-xs opacity-80 mt-0.5">{status.subtitle}</div>}
            </div>
          </div>
        )}

        {/* Scan hero (Participant only) — replaces the gradient hero */}
        {scanHero ? (
          <ScanHeroBlock
            b={b}
            eyebrow={scanHero.eyebrow}
            title={scanHero.title}
            ctaLabel={scanHero.ctaLabel}
            ctaHref={scanHero.ctaHref}
            hint={scanHero.hint}
          />
        ) : (
          hero && <HeroBlock b={b} hero={hero} />
        )}

        {/* Quick grid (4 tiles) */}
        {quickItems.length > 0 && (
          <section className="grid grid-cols-4 gap-2.5 mt-4">
            {quickItems.slice(0, 4).map((q) => {
              const Icon = q.icon;
              const softFallback = b.soft;
              return (
                <Link
                  key={q.label}
                  href={q.href}
                  className="bg-white border border-border rounded-2xl px-2 pt-3 pb-2 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <div
                    className="grid place-items-center size-9 rounded-[10px]"
                    style={{ backgroundColor: softFallback, color: b.hex }}
                  >
                    <Icon className="size-[18px]" />
                  </div>
                  <div className="text-[10.5px] font-semibold leading-tight text-center">
                    {q.label}
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        {/* Pill chips row */}
        {pillChips && pillChips.length > 0 && (
          <section className="mt-5 -mx-4 px-4 overflow-x-auto scrollbar-none">
            <div className="flex gap-2 pb-1 min-w-max">
              {pillChips.map((chip, i) => {
                const Icon = chip.icon;
                if (chip.primary) {
                  return (
                    <Link
                      key={i}
                      href={chip.href ?? "#"}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-white text-xs font-semibold whitespace-nowrap shadow-md active:scale-95 transition-transform"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${b.hex}, ${b.deep})`,
                        boxShadow: `0 8px 18px -6px ${b.deep}55`,
                      }}
                    >
                      {Icon && <Icon className="size-3.5" />}
                      {chip.label}
                    </Link>
                  );
                }
                return (
                  <Link
                    key={i}
                    href={chip.href ?? "#"}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 bg-white border border-border text-xs font-semibold whitespace-nowrap shadow-sm active:scale-95 transition-transform"
                  >
                    {Icon && <Icon className="size-3.5 text-muted-foreground" />}
                    {chip.label}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Plans carousel */}
        {carousel && carousel.items.length > 0 && (
          <section className="mt-6 -mx-4">
            <SectionTitle title={carousel.title} seeLabel={carousel.seeAllLabel} seeHref={carousel.seeAllHref} accent={b.hex} />
            <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-none">
              {carousel.items.map((item, i) => (
                <CarouselCard key={i} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Activity timeline */}
        {timeline && timeline.items.length > 0 && (
          <section className="mt-6">
            <SectionTitle title={timeline.title} seeLabel={timeline.seeAllLabel} seeHref={timeline.seeAllHref} accent={b.hex} />
            <div className="bg-white border border-border rounded-2xl py-1 px-3.5 shadow-sm">
              {timeline.items.map((t, i) => {
                const Icon = t.icon;
                const isLast = i === timeline.items.length - 1;
                return (
                  <div key={i} className="flex gap-3 py-3 relative">
                    {/* dot */}
                    <div
                      className={cn(
                        "size-8 rounded-full grid place-items-center shrink-0",
                        t.iconColor ?? "text-foreground",
                      )}
                      style={{ backgroundColor: b.soft }}
                    >
                      {Icon ? <Icon className="size-4" /> : <span className="size-1.5 rounded-full bg-current" />}
                    </div>
                    {/* rail */}
                    {!isLast && (
                      <span
                        className="absolute left-[26px] top-11 bottom-0 w-px bg-border"
                        aria-hidden
                      />
                    )}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="text-[13px] font-semibold leading-snug">{t.title}</div>
                      {t.time && <div className="text-[11px] text-muted-foreground mt-0.5">{t.time}</div>}
                    </div>
                    {t.badge && (
                      <span className={cn(
                        "self-start mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap",
                        TONE_BG[t.badge.tone ?? "neutral"],
                      )}>
                        {t.badge.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Bottom CTA pill */}
        {bottomCta && (
          <Link
            href={bottomCta.href}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-transform"
            style={{
              backgroundImage: `linear-gradient(135deg, ${b.hex}, ${b.deep})`,
              boxShadow: `0 14px 30px -10px ${b.deep}55`,
            }}
          >
            {bottomCta.label}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>

      {/* Bottom dock — 2 tabs | FAB | 2 tabs */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto max-w-md bg-white/95 backdrop-blur-xl border border-border rounded-[26px] shadow-[0_14px_34px_-10px_rgba(14,26,43,0.20)]">
          <ul className="grid grid-cols-[1fr_1fr_80px_1fr_1fr] items-center px-1.5 py-2.5">
            {nav.map((n, i) => {
              const Icon = n.icon;
              if (n.isFab) {
                return (
                  <li key={i} className="flex justify-center">
                    <Link
                      href={n.href}
                      aria-label={n.label}
                      className="-translate-y-5 grid place-items-center size-14 rounded-full text-white border-4 border-white shadow-lg active:scale-95 transition-transform"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${b.hex}, ${b.deep})`,
                        boxShadow: `0 12px 26px -8px ${b.deep}aa`,
                      }}
                    >
                      <FabIcon className="size-6" strokeWidth={2.5} />
                    </Link>
                  </li>
                );
              }
              return (
                <li key={i} className="relative">
                  <Link
                    href={n.href}
                    className="flex flex-col items-center gap-1 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <Icon className="size-5" />
                    <span>{n.label}</span>
                    {!!n.badge && n.badge > 0 && (
                      <span className="absolute top-1 right-3 min-w-4 h-4 px-1 grid place-items-center rounded-full bg-rose-500 text-white text-[9px] font-bold border-2 border-white">
                        {n.badge > 9 ? "9+" : n.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}

// Active-tab highlighting is intentionally subtle in v3 (the mockup keeps the
// bottom dock static and lets the FAB do the visual heavy lifting). A future
// enhancement can swap the active tab's text color to `b.hex` based on
// `usePathname()` — left as-is for now to avoid hydration churn.

// ─── Sub-blocks ───────────────────────────────────────────────────────────────

function HeroBlock({ b, hero }: { b: Brand; hero: MobileHeroProps }) {
  return (
    <section className="relative overflow-hidden rounded-3xl p-5 text-white shadow-[0_14px_30px_-10px_rgba(0,0,0,0.3)]">
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `linear-gradient(135deg, ${b.hex}, ${b.deep})` }}
        aria-hidden
      />
      {/* radial highlight */}
      <div
        className="absolute -top-1/2 -right-1/4 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 65%)" }}
        aria-hidden
      />
      <div className="relative">
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold opacity-90">
          {hero.eyebrow}
        </div>
        <h1 className="mt-1.5 text-[22px] font-extrabold leading-tight tracking-tight">
          {hero.title}
          {hero.countPill && (
            <span className="inline-flex items-baseline ml-2 px-2.5 py-1 rounded-full bg-white/20 text-[12px] font-bold">
              {hero.countPill}
            </span>
          )}
        </h1>
        {hero.description && (
          <p className="mt-1 text-[13px] opacity-90">{hero.description}</p>
        )}
        {hero.stats && hero.stats.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {hero.stats.map((s) => (
              <div key={s.label} className="bg-white/15 rounded-xl px-2 py-2 backdrop-blur-sm">
                <div className="text-[15px] font-extrabold leading-none tabular-nums">{s.value}</div>
                <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}
        {hero.ctaLabel && hero.ctaHref && (
          <Link
            href={hero.ctaHref}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 bg-white text-[12px] font-bold active:scale-95 transition-transform"
            style={{ color: b.deep }}
          >
            {hero.ctaLabel}
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
    </section>
  );
}

function ScanHeroBlock({
  b, eyebrow, title, ctaLabel, ctaHref, hint,
}: { b: Brand } & ScanHeroProps) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl p-5 text-white shadow-[0_14px_30px_-10px_rgba(0,0,0,0.3)]"
      style={{ backgroundImage: `linear-gradient(160deg, ${b.deep}, ${b.hex})` }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.22), transparent 50%)" }}
        aria-hidden
      />
      <div className="relative">
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] opacity-90">{eyebrow}</div>
        <h2 className="mt-1 mb-4 text-[18px] font-extrabold leading-tight">{title}</h2>
        <Link
          href={ctaHref}
          className="w-full inline-flex items-center justify-center gap-2.5 rounded-full px-5 py-3.5 bg-white font-extrabold text-[14px] tracking-tight shadow-md active:scale-[0.98] transition-transform"
          style={{ color: b.deep }}
        >
          <QrCode className="size-5" strokeWidth={2.5} />
          {ctaLabel}
        </Link>
        {hint && (
          <div className="mt-2.5 text-center text-[11px] opacity-85">{hint}</div>
        )}
      </div>
    </section>
  );
}

function SectionTitle({
  title, seeLabel, seeHref, accent,
}: { title: string; seeLabel?: string; seeHref?: string; accent: string }) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <h3 className="text-[14px] font-bold tracking-tight">{title}</h3>
      {seeLabel && (
        seeHref ? (
          <Link href={seeHref} className="text-[11px] font-bold" style={{ color: accent }}>
            {seeLabel}
          </Link>
        ) : (
          <button type="button" className="text-[11px] font-bold" style={{ color: accent }}>
            {seeLabel}
          </button>
        )
      )}
    </div>
  );
}

function CarouselCard({ item }: { item: CarouselItem }) {
  const tone = CAROUSEL_TONE[item.tone ?? "b"];
  return (
    <Link
      href={item.href ?? "#"}
      className={cn(
        "shrink-0 snap-start w-60 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform",
        tone.bg,
      )}
    >
      <span className={cn("inline-block px-2 py-1 rounded-full text-[10px] font-bold mb-2.5", tone.badge)}>
        {item.badge}
      </span>
      <h4 className={cn("text-[14px] font-bold leading-tight m-0", tone.text)}>{item.title}</h4>
      {item.subtitle && (
        <p className={cn("mt-1.5 text-[11px] leading-snug opacity-80 m-0", tone.text)}>
          {item.subtitle}
        </p>
      )}
      <span className={cn("inline-flex items-center gap-1 mt-3 text-[11px] font-bold", tone.text)}>
        Open <ArrowRight className="size-3" />
      </span>
    </Link>
  );
}

// ─── Default nav / FAB per role ──────────────────────────────────────────────

function defaultNav(role: MobileRole): NavItem[] {
  // Bump FAB into the 3rd slot (index 2) so the dock renders as
  // [tab] [tab] [FAB] [tab] [tab]. Two tabs each side.
  if (role === "PARTICIPANT") {
    return [
      { label: "Home",    icon: Home,     href: "/m/participant" },
      { label: "Classes", icon: Calendar, href: "/m/participant" },
      { label: "Scan",    icon: QrCode,   href: "/m/participant/scan", isFab: true },
      { label: "Inbox",   icon: Bell,     href: "/m/notifications" },
      { label: "Me",      icon: User,     href: "/m/profile" },
    ];
  }
  if (role === "TRAINER") {
    return [
      { label: "Home",     icon: Home,     href: "/m" },
      { label: "Schedule", icon: Calendar, href: "/m/trainer/calendar" },
      { label: "Create",   icon: Plus,     href: "/trainer/programs/new", isFab: true },
      { label: "Inbox",    icon: Bell,     href: "/m/notifications" },
      { label: "Me",       icon: User,     href: "/m/profile" },
    ];
  }
  if (role === "HR") {
    return [
      { label: "Home",     icon: Home,     href: "/m" },
      { label: "Sessions", icon: Calendar, href: "/m/hr/calendar" },
      { label: "Create",   icon: Plus,     href: "/m/hr/employees/new", isFab: true },
      { label: "Inbox",    icon: Bell,     href: "/m/notifications" },
      { label: "Me",       icon: User,     href: "/m/profile" },
    ];
  }
  // ADMIN
  return [
    { label: "Home",     icon: Home,     href: "/m" },
    { label: "Bookings", icon: Calendar, href: "/m/admin/bookings" },
    { label: "Create",   icon: Plus,     href: "/admin/programs", isFab: true },
    { label: "Team",     icon: Users,    href: "/m/admin/trainers" },
    { label: "Me",       icon: User,     href: "/m/profile" },
  ];
}

function defaultFabIcon(role: MobileRole) {
  return role === "PARTICIPANT" ? QrCode : Plus;
}
