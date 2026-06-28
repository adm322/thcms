"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLang } from "@/components/LanguageProvider";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { Loader2, Menu, X, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const { lang, setLang } = useLang();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  // Load dark mode
  useEffect(() => {
    const stored = localStorage.getItem("trainhub-dark");
    if (stored === "true" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("trainhub-dark", String(next));
  }

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  // Close mobile sidebar on Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <div className="flex flex-1 w-full overflow-hidden">

      {/* === DESKTOP SIDEBAR (always visible on lg+) === */}
      <div className="hidden lg:flex lg:w-60 lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* === MOBILE DRAWER (slides over on small screens) === */}
      {mobileOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar drawer */}
          <div className="fixed inset-y-0 left-0 z-50 w-60 lg:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* === RIGHT SIDE: Navbar + Content === */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-16 flex-shrink-0 items-center gap-3 border-b bg-background px-4 lg:px-6">
          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden rounded-md p-2 -ml-2 hover:bg-accent"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo on mobile */}
          <span className="lg:hidden text-sm font-bold tracking-tight">TrainHub</span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Notifications (single unified inbox — covers both notifications and contextual actions) */}
          <NotificationBell role={user.role} />

          {/* User area */}
          <button onClick={toggleDark} className="rounded-md p-2 hover:bg-accent" title="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setLang(lang === "en" ? "ms" : "en")}
            className="rounded-md px-2 py-1 text-xs font-medium hover:bg-accent"
            title="Tukar bahasa"
          >
            {lang === "en" ? "BM" : "EN"}
          </button>
          <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
          <button
            onClick={logout}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-2"
          >
            Sign out
          </button>
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto"
          onClick={() => setMobileOpen(false)}
        >
          <div className="p-4 lg:p-8 lg:max-w-6xl lg:mx-auto section-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
    </div>
  );
}
