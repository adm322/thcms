"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "trainhub-view-pref";

export function ViewToggle() {
  const router = useRouter();
  const [mode, setMode] = useState<"mobile" | "desktop">(() => {
    if (typeof window === "undefined") return "mobile";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "mobile" || stored === "desktop") return stored;
    return window.matchMedia("(max-width: 640px)").matches ? "mobile" : "desktop";
  });

  function pick(next: "mobile" | "desktop") {
    setMode(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* noop */ }
    // Send the user to the right dashboard.
    const dest = next === "mobile" ? "/m" : "/";
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-1 grid grid-cols-2 gap-1 shadow-sm">
      <Choice
        active={mode === "mobile"}
        onClick={() => pick("mobile")}
        label="Mobile"
        hint="Bottom dock"
        icon={<Smartphone className="size-3.5" />}
      />
      <Choice
        active={mode === "desktop"}
        onClick={() => pick("desktop")}
        label="Desktop"
        hint="Full sidebar"
        icon={<Monitor className="size-3.5" />}
      />
    </div>
  );
}

function Choice({
  active, onClick, label, hint, icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl py-3 px-2 flex flex-col items-center gap-1 transition-all",
        active
          ? "bg-background shadow-sm text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
        {icon}
        {label}
        {active && <Check className="size-3 text-[var(--brand)]" />}
      </span>
      <span className="text-[10px] text-muted-foreground">{hint}</span>
    </button>
  );
}

