"use client";

import Link from "next/link";
import { Smartphone } from "lucide-react";

/**
 * Floating link that appears only on small viewports (lg:hidden) to let the
 * user jump into the /m mobile view from the existing desktop dashboard.
 *
 * Drop into any client component inside (dashboard). Server pages can render
 * it directly — it has no state, only a Link.
 */
export function MobileViewLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/m"
      className={`fixed bottom-20 right-4 z-40 lg:hidden flex items-center gap-1.5 rounded-full bg-foreground text-background px-3.5 py-2 text-xs font-medium shadow-lg active:scale-95 transition-transform ${className}`}
      aria-label="Open mobile view"
    >
      <Smartphone className="size-3.5" />
      Mobile view
    </Link>
  );
}
