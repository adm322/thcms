"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ACCOUNTS = [
  { email: "admin@trainhub.my", label: "Admin", role: "ADMIN" as const },
  { email: "aisha@trainhub.my", label: "Aisha", role: "TRAINER" as const },
  { email: "jason@trainhub.my", label: "Jason", role: "TRAINER" as const },
  { email: "sarah@trainhub.my", label: "Sarah", role: "TRAINER" as const },
  { email: "hr@petronas.my", label: "Petronas", role: "HR" as const },
  { email: "hr@maybank.my", label: "Maybank", role: "HR" as const },
  { email: "hr@topglove.my", label: "Top Glove", role: "HR" as const },
  { email: "hr@airasia.my", label: "AirAsia", role: "HR" as const },
  { email: "hr@tm.my", label: "TM", role: "HR" as const },
  { email: "hr@sdarby.my", label: "Sime Darby", role: "HR" as const },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500",
  TRAINER: "bg-blue-500",
  HR: "bg-emerald-500",
};

export function DevSwitcher({ currentEmail }: { currentEmail?: string }) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Check if dev mode was enabled before (localStorage)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setEnabled(localStorage.getItem("trainhub_dev") === "1");
    }
  }, []);

  // Toggle dev mode with Ctrl+Shift+D
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        const next = !enabled;
        setEnabled(next);
        localStorage.setItem("trainhub_dev", next ? "1" : "0");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [enabled]);

  async function switchTo(email: string) {
    setSwitching(email);
    try {
      // Login as the selected user
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "password123" }),
      });
      const data = await res.json();
      if (res.ok) {
        const dashboardPath = data.user.role === "ADMIN" ? "/admin" : data.user.role === "TRAINER" ? "/trainer" : "/hr";
        router.push(dashboardPath);
        router.refresh();
      }
    } catch { /* ignore */ }
    setSwitching(null);
  }

  // Get current account info
  const currentAccount = ACCOUNTS.find(a => a.email === currentEmail);
  const admins = ACCOUNTS.filter(a => a.role === "ADMIN");
  const trainers = ACCOUNTS.filter(a => a.role === "TRAINER");
  const hrs = ACCOUNTS.filter(a => a.role === "HR");

  if (!enabled) return null;

  return (
    <>
      {/* Floating toolbar — in-flow at top */}
      <div className="bg-card border-b shadow-sm">
        <div className="flex items-center h-10 px-3 gap-1.5 overflow-x-auto">
          {/* Toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold bg-muted hover:bg-accent transition-colors flex-shrink-0"
          >
            {open ? "▲" : "▲"} DEV
          </button>

          {!open ? (
            /* Collapsed: show current role dot + label */
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {currentAccount ? (
                <span className="flex items-center gap-1">
                  <span className={cn("h-1.5 w-1.5 rounded-full", ROLE_COLORS[currentAccount.role])} />
                  {currentAccount.label}
                </span>
              ) : "—"}
            </span>
          ) : (
            /* Expanded: all accounts */
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-muted-foreground flex-shrink-0">Admin:</span>
              {admins.map(a => (
                <button key={a.email} onClick={() => switchTo(a.email)}
                  disabled={switching === a.email}
                  className={cn(
                    "rounded-md px-2 py-0.5 font-medium border transition-colors flex-shrink-0",
                    currentEmail === a.email ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent border-transparent"
                  )}>
                  {switching === a.email ? "..." : a.label}
                </button>
              ))}
              <span className="text-muted-foreground flex-shrink-0 ml-1">Trainers:</span>
              {trainers.map(a => (
                <button key={a.email} onClick={() => switchTo(a.email)}
                  disabled={switching === a.email}
                  className={cn(
                    "rounded-md px-2 py-0.5 font-medium border transition-colors flex-shrink-0",
                    currentEmail === a.email ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent border-transparent"
                  )}>
                  {switching === a.email ? "..." : a.label}
                </button>
              ))}
              <span className="text-muted-foreground flex-shrink-0 ml-1">HR:</span>
              {hrs.map(a => (
                <button key={a.email} onClick={() => switchTo(a.email)}
                  disabled={switching === a.email}
                  className={cn(
                    "rounded-md px-2 py-0.5 font-medium border transition-colors flex-shrink-0",
                    currentEmail === a.email ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent border-transparent"
                  )}>
                  {switching === a.email ? "..." : a.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1" />

          {/* Close dev mode */}
          <button
            onClick={() => { setEnabled(false); localStorage.removeItem("trainhub_dev"); }}
            className="text-[10px] text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
}
