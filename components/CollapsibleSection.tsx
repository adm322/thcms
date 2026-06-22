"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  title: React.ReactNode;
  subtitle?: string;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, subtitle, defaultOpen = true, badge, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="text-sm font-semibold">{title}</span>
          {badge && (
            <span className="text-[10px] font-medium text-muted-foreground bg-accent px-2 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
        {subtitle && <span className="text-xs text-muted-foreground hidden sm:inline">{subtitle}</span>}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}
