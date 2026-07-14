"use client";

/**
 * FloatingProgress — non-blocking circular progress indicator.
 * Fixed bottom-right, shows a ring with percentage + current step name.
 * Replaces the full-page GenerationOverlay with something the trainer
 * can keep an eye on while continuing to use the page.
 *
 * States:
 *   running — spinning ring, percentage, step name, pulse glow
 *   done    — green ring, checkmark, dismiss button
 *   error   — red ring, error icon, message, dismiss button
 */

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, X, Sparkles } from "lucide-react";

export interface FloatingProgressStep {
  id: string;
  label: string;
}

export interface FloatingProgressData {
  /** Current step index (0-based). -1 = not started, >= steps.length = done. */
  currentStep: number;
  steps: FloatingProgressStep[];
  /** Elapsed seconds displayed in the pill. */
  elapsed?: number;
  /** Error message, if status is "error". */
  errorMessage?: string;
}

interface FloatingProgressProps {
  data: FloatingProgressData | null;
  onDismiss: () => void;
}

export function FloatingProgress({ data, onDismiss }: FloatingProgressProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!data || dismissed) return null;

  const total = data.steps.length;
  const current = Math.min(data.currentStep, total);
  const isDone = data.currentStep >= total;
  const isError = Boolean(data.errorMessage);
  const isRunning = !isDone && !isError;
  const progress = Math.round((current / total) * 100);

  // SVG ring dimensions
  const R = 24; // radius
  const CIRCUMFERENCE = 2 * Math.PI * R;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed bottom-6 right-6 z-[100] flex items-start gap-3
        rounded-2xl shadow-2xl border p-4 max-w-[320px]
        backdrop-blur-md transition-all duration-300
        ${isError
          ? "bg-rose-50/95 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800/60"
          : isDone
            ? "bg-emerald-50/95 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800/60"
            : "bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-indigo-500/10"
        }
      `}
    >
      {/* Circular ring */}
      <div className="relative shrink-0">
        <svg width="60" height="60" viewBox="0 0 60 60">
          {/* Background ring */}
          <circle
            cx="30" cy="30" r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            className={isError
              ? "text-rose-200/60 dark:text-rose-800/30"
              : isDone
                ? "text-emerald-200/60 dark:text-emerald-800/30"
                : "text-slate-200 dark:text-slate-800"
            }
          />
          {/* Progress ring */}
          {isRunning ? (
            <>
              <circle
                cx="30" cy="30" r={R}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
                strokeLinecap="round"
                className="text-indigo-500 dark:text-indigo-400 transition-all duration-700"
                style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
              />
              {/* Pulse ring */}
              <circle
                cx="30" cy="30" r={R}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                opacity="0.15"
                className="text-indigo-500 dark:text-indigo-400 animate-ping"
                style={{ animationDuration: "2s" }}
              />
            </>
          ) : isDone ? (
            <circle
              cx="30" cy="30" r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={0}
              strokeLinecap="round"
              className="text-emerald-500"
              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
          ) : (
            <circle
              cx="30" cy="30" r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * 0.25}
              strokeLinecap="round"
              className="text-rose-500"
              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
          )}
        </svg>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isDone ? (
            <CheckCircle2 className="size-5 text-emerald-500" />
          ) : isError ? (
            <AlertCircle className="size-5 text-rose-500" />
          ) : (
            <Loader2 className="size-5 text-indigo-500 animate-spin" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[11px] font-bold uppercase tracking-wider ${
            isError
              ? "text-rose-600 dark:text-rose-300"
              : isDone
                ? "text-emerald-600 dark:text-emerald-300"
                : "text-indigo-600 dark:text-indigo-300"
          }`}>
            {isError ? "Generation failed" : isDone ? "Studio ready" : "Generating studio"}
          </p>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              // Only call onDismiss when done or errored (user can't dismiss running)
              if (!isRunning) onDismiss();
            }}
            disabled={isRunning}
            className="shrink-0 size-6 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Dismiss"
            title={isRunning ? "Wait for completion" : "Dismiss"}
          >
            <X className="size-3" />
          </button>
        </div>

        {/* Percentage + step */}
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
          {progress}% complete
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {isError
            ? data.errorMessage ?? "Something went wrong"
            : isDone
              ? "Slides and quiz ready — click to view"
              : data.steps[current]?.label ?? "Preparing…"
          }
          {data.elapsed !== undefined && isRunning ? ` · ${data.elapsed}s` : ""}
        </p>

        {/* Quick action on done */}
        {isDone && !isError ? (
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              onDismiss();
            }}
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold py-1.5 transition"
          >
            <CheckCircle2 className="size-3" />
            Dismiss & view program
          </button>
        ) : null}
      </div>
    </div>
  );
}
