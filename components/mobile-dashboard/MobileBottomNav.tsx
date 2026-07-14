"use client";

/**
 * MobileBottomNav — role-aware bottom navigation dock rendered at the layout
 * level so every mobile route gets a persistent tab bar.
 *
 * Replaces the generic router.back() pattern in app/m/layout.tsx with
 * proper 4-5 tab role-appropriate navigation.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Users,
  DollarSign,
  Bell,
  BookOpen,
  Wallet,
  User,
  MessageSquare,
  QrCode,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MobileRole } from "./types";

// ─── Tab definition ─────────────────────────────────────────────────────────

interface TabDef {
  label: string;
  icon: LucideIcon;
  href: string;
  /** Match pathnames that start with this prefix (for nested routes). */
  matchPrefix?: string;
}

// ─── Per-role tab sets ──────────────────────────────────────────────────────

const ADMIN_TABS: TabDef[] = [
  { label: "Home",    icon: Home,       href: "/m",                  matchPrefix: "/m" },
  { label: "Bookings",icon: Calendar,   href: "/m/admin/bookings",   matchPrefix: "/m/admin/bookings" },
  { label: "Trainers",icon: Users,      href: "/m/admin/trainers",   matchPrefix: "/m/admin/trainers" },
  { label: "Finance", icon: BarChart3,  href: "/m/admin/finance",    matchPrefix: "/m/admin/finance" },
  { label: "Inbox",   icon: Bell,       href: "/m/notifications",    matchPrefix: "/m/notifications" },
];

const TRAINER_TABS: TabDef[] = [
  { label: "Home",     icon: Home,      href: "/m",                   matchPrefix: "/m" },
  { label: "Programs", icon: BookOpen,  href: "/m/trainer/programs",  matchPrefix: "/m/trainer/programs" },
  { label: "Calendar", icon: Calendar,  href: "/m/trainer/calendar",  matchPrefix: "/m/trainer/calendar" },
  { label: "Earnings", icon: Wallet,    href: "/m/trainer/earnings",  matchPrefix: "/m/trainer/earnings" },
  { label: "Profile",  icon: User,      href: "/m/profile",           matchPrefix: "/m/profile" },
];

const HR_TABS: TabDef[] = [
  { label: "Home",      icon: Home,          href: "/m",                matchPrefix: "/m" },
  { label: "Employees", icon: Users,         href: "/m/hr/employees",   matchPrefix: "/m/hr/employees" },
  { label: "Bookings",  icon: Calendar,      href: "/m/hr/new-booking", matchPrefix: "/m/hr" },
  { label: "Messages",  icon: MessageSquare, href: "/m/hr/calendar",    matchPrefix: "/m/hr/calendar" },
  { label: "Profile",   icon: User,          href: "/m/profile",        matchPrefix: "/m/profile" },
];

const PARTICIPANT_TABS: TabDef[] = [
  { label: "Home",      icon: Home,      href: "/m",                    matchPrefix: "/m" },
  { label: "My Classes",icon: BookOpen,  href: "/m/participant",        matchPrefix: "/m/participant" },
  { label: "Scan",      icon: QrCode,    href: "/m/participant/scan",   matchPrefix: "/m/participant/scan" },
  { label: "Inbox",     icon: Bell,      href: "/m/notifications",      matchPrefix: "/m/notifications" },
  { label: "Profile",   icon: User,      href: "/m/profile",            matchPrefix: "/m/profile" },
];

function getTabs(role: MobileRole): TabDef[] {
  switch (role) {
    case "ADMIN":       return ADMIN_TABS;
    case "TRAINER":     return TRAINER_TABS;
    case "HR":          return HR_TABS;
    case "PARTICIPANT": return PARTICIPANT_TABS;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

interface MobileBottomNavProps {
  role: MobileRole;
  /** When true, the nav is hidden (e.g. on the /m home page where the
   *  MobileDashboard already renders its own dock). */
  hideOnHome?: boolean;
}

export function MobileBottomNav({ role, hideOnHome = true }: MobileBottomNavProps) {
  const pathname = usePathname();
  const tabs = React.useMemo(() => getTabs(role), [role]);

  // On the exact /m home page, hide this nav so it doesn't stack with the
  // MobileDashboard's internal bottom dock.
  if (hideOnHome && pathname === "/m") return null;

  // Also hide on quiz pages (standalone quiz flow doesn't need the dock)
  if (pathname?.startsWith("/m/quiz")) return null;

  function isActive(tab: TabDef): boolean {
    if (!pathname) return false;
    // Exact home match
    if (tab.href === "/m" && pathname === "/m") return true;
    // Prefix match for nested routes (but not for /m itself when on sub-routes
    // of other sections)
    if (tab.matchPrefix && tab.matchPrefix !== "/m" && pathname.startsWith(tab.matchPrefix)) return true;
    // Exact match for non-home tabs
    if (tab.href !== "/m" && pathname === tab.href) return true;
    return false;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors",
                  active
                    ? "text-[var(--brand,var(--color-primary,#8b5cf6))]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-colors",
                    active && "text-[var(--brand,var(--color-primary,#8b5cf6))]",
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
