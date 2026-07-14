"use client";

/**
 * FormChecklist — real-time completeness card for the program form.
 * Displayed in the right column (below the action panel). Updates
 * live as the trainer fills fields.
 *
 * Items:
 *   - Title entered
 *   - Description added
 *   - Category selected
 *   - Duration/capacity/price set
 *   - Location set
 *   - Modules added (at least 1 with title)
 *   - Itinerary set (suggested, optional)
 *   - Proposal generated (auto-filled)
 */

import { CheckCircle2, Circle, Sparkles } from "lucide-react";

export interface FormChecklistState {
  title: boolean;
  description: boolean;
  category: boolean;
  numericFields: boolean; // duration + max + price > 0
  location: boolean;
  modules: boolean; // at least 1 module with title
  itinerary: boolean; // at least 1 itinerary slot
  proposal: boolean; // proposal content present
}

interface FormChecklistProps {
  state: FormChecklistState;
}

const ITEMS: { key: keyof FormChecklistState; label: string; important?: boolean }[] = [
  { key: "title", label: "Program title entered", important: true },
  { key: "description", label: "Description added" },
  { key: "category", label: "Category selected" },
  { key: "numericFields", label: "Duration, capacity & price set", important: true },
  { key: "location", label: "Location set" },
  { key: "modules", label: "At least 1 module with title", important: true },
  { key: "itinerary", label: "Day schedule set (suggested)" },
  { key: "proposal", label: "Proposal generated" },
];

export function FormChecklist({ state }: FormChecklistProps) {
  const done = Object.values(state).filter(Boolean).length;
  const total = ITEMS.length;
  const allDone = done === total;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Form Checklist
          </p>
        </div>
      </div>
      <div className="p-4 space-y-2.5">
        {ITEMS.map((item) => {
          const isDone = state[item.key];
          return (
            <div
              key={item.key}
              className={`flex items-start gap-2.5 text-xs leading-snug ${
                isDone
                  ? "text-emerald-700 dark:text-emerald-300"
                  : item.important
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <Circle className="size-3.5 shrink-0 mt-0.5 opacity-40" />
              )}
              <span className={isDone ? "" : "opacity-60"}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className={`px-4 py-2 text-[10px] font-semibold text-center ${
        allDone
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"
          : "bg-slate-50 text-slate-500 dark:bg-slate-950/30 dark:text-slate-400"
      }`}>
        {allDone
          ? "Everything looks good!"
          : `${done} of ${total} items complete`}
      </div>
    </div>
  );
}
