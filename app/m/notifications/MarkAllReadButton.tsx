"use client";

import { useState, useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Calls POST /api/notifications/mark-all-read (assumed) and refreshes the page.
 * Optimistically hides the button when clicked.
 */
export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();
  const [clicked, setClicked] = useState(false);

  function onClick() {
    setClicked(true);
    startTransition(async () => {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "markAllRead" }),
        });
        // Tiny delay so the optimistic UI feels natural.
        setTimeout(() => {
          if (typeof window !== "undefined") window.location.reload();
        }, 250);
      } catch {
        setClicked(false);
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending || clicked}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full",
        "bg-white border border-border shadow-sm active:scale-95 transition-transform",
        "text-[var(--brand)] disabled:opacity-60",
      )}
    >
      <CheckCheck className="size-3.5" />
      {pending || clicked ? "Marking…" : "Mark all read"}
    </button>
  );
}

