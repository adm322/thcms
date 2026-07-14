"use client";

import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStepDef {
  label: string;
  icon: LucideIcon;
}

/**
 * Horizontal stepper shown above a wizard's content card.
 *
 * Props:
 *   steps    — ordered list of step definitions (label + icon)
 *   current  — 0-based index of the active step
 *
 * All colors are driven by CSS custom properties (`--brand` / `--brand-deep`)
 * already set on the parent dashboard root, so the same component renders
 * correctly for every role's brand color without prop drilling.
 */
export function WizardStepper({
  steps,
  current,
  className,
}: {
  steps:   WizardStepDef[];
  current: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex items-center justify-between gap-2 px-2", className)}>
      {steps.map((s, i) => {
        const isCurrent = i === current;
        const isDone    = i < current;
        return (
          <li
            key={s.label}
            className="flex-1 flex flex-col items-center gap-1.5"
            aria-current={isCurrent ? "step" : undefined}
          >
            <div
              className={cn(
                "size-9 rounded-full grid place-items-center shrink-0 transition-all",
                isDone    && "bg-[var(--brand-deep)] text-white",
                isCurrent && "bg-[var(--brand)] text-white shadow-md",
                !isCurrent && !isDone && "bg-muted text-muted-foreground",
              )}
            >
              {isDone ? <Check className="size-4" strokeWidth={3} /> : <s.icon className="size-4" />}
            </div>
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-wide",
                (isCurrent || isDone) ? "text-[var(--brand-deep)]" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
