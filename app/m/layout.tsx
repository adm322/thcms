"use client";

/**
 * Mobile shell — bypasses the desktop sidebar/drawer from app/(dashboard)/layout.tsx
 * and gives /m a full-screen, app-like experience.
 *
 * Top bar (theme toggle + sign-out) + role-aware bottom navigation dock
 * replaces the old router.back() pattern with proper tab-based navigation.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Sun, Moon, LogOut, Monitor } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLang } from "@/components/LanguageProvider";
import { BRAND, type MobileRole } from "@/components/mobile-dashboard/types";
import { MobileBottomNav } from "@/components/mobile-dashboard/MobileBottomNav";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const { lang, setLang } = useLang();

  // Lazy-initialize dark state from localStorage — runs once on client mount.
  // Server renders with false (no class), then the client corrects it before paint.
  const [dark, setDark] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("trainhub-dark", String(next));
  }

  if (loading) {
    return (
      <div className="grid h-dvh place-items-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (!user) {
    // AuthProvider will redirect to /login via the parent effect; render a quiet placeholder.
    return (
      <div className="grid h-dvh place-items-center text-muted-foreground text-sm">
        Redirecting…
      </div>
    );
  }

  // Public routes under /m that don't require authentication (e.g. /m/quiz)
  if (pathname?.startsWith("/m/quiz")) {
    return <>{children}</>;
  }

  const role = (user?.role ?? "PARTICIPANT") as MobileRole;
  const brand = BRAND[role] ?? BRAND.PARTICIPANT;
  const isHome = pathname === "/m";

  const desktopPath: Record<string, string> = {
    ADMIN: "/admin",
    TRAINER: "/trainer",
    HR: "/hr",
    PARTICIPANT: "/participant",
  };
  const desktopHref = desktopPath[user?.role ?? "PARTICIPANT"] ?? "/participant";

  return (
    <div
      className="min-h-dvh bg-background text-foreground pb-16"
      style={
        {
          "--brand": brand.hex,
          "--brand-deep": brand.deep,
          "--brand-soft": brand.soft,
        } as React.CSSProperties
      }
    >
      {/* Top app bar — minimal, app-like */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-2 px-4 h-12 border-b border-border bg-background/85 backdrop-blur-xl">
        {/* Back button only on sub-pages; hidden on home (bottom nav handles it) */}
        {isHome ? (
          <div className="size-9" aria-hidden />
        ) : (
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="grid place-items-center size-9 -ml-1 rounded-md hover:bg-muted"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <Link href="/m" className="text-sm font-semibold tracking-tight">
          TrainHub
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLang(lang === "en" ? "ms" : "en")}
            aria-label="Toggle language"
            className="px-2 h-9 rounded-md text-xs font-medium hover:bg-muted"
          >
            {lang === "en" ? "BM" : "EN"}
          </button>
          <button
            onClick={toggleDark}
            aria-label="Toggle theme"
            className="grid place-items-center size-9 rounded-md hover:bg-muted"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            onClick={logout}
            aria-label="Sign out"
            className="grid place-items-center size-9 rounded-md hover:bg-muted text-muted-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {children}

      {/* Role-aware bottom navigation dock */}
      <MobileBottomNav role={role} />

      {/* Desktop view link — visible only on large screens */}
      <Link
        href={desktopHref}
        className="fixed bottom-20 left-4 z-40 hidden lg:flex items-center gap-1.5 rounded-full bg-foreground text-background px-3.5 py-2 text-xs font-medium shadow-lg active:scale-95 transition-transform"
        aria-label="Open desktop view"
      >
        <Monitor className="size-3.5" />
        Desktop view
      </Link>
    </div>
  );
}
