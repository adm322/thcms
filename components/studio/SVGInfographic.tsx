"use client";

/**
 * SVGInfographic — Renders the 5 infographic types from generated slide JSON
 * (stat, quote, list, comparison, process) as designed React components.
 *
 * We deliberately IGNORE `svgMarkup` from the AI because DeepSeek returns
 * terrible placeholder SVGs. We use the structured `data` field instead.
 */

import { cn } from "@/lib/utils";
import { Sparkles, Quote as QuoteIcon, GitBranch, BarChart3, Layers, type LucideIcon } from "lucide-react";

export interface Infographic {
  type: "stat" | "list" | "comparison" | "process" | "quote";
  title?: string;
  data?: Record<string, unknown>;
  svgMarkup?: string; // ignored — we render from structured data
}

interface SVGInfographicProps {
  infographic: Infographic;
  className?: string;
}

// Color palettes per type — keeps the slide deck visually varied
const PALETTES = {
  stat:        { bg: "from-indigo-600 to-violet-600", accent: "indigo", icon: BarChart3 },
  quote:       { bg: "from-slate-50 to-white",       accent: "indigo", icon: QuoteIcon },
  list:        { bg: "from-sky-50 to-white",         accent: "sky",    icon: Layers },
  comparison:  { bg: "from-amber-50 to-white",       accent: "amber",  icon: GitBranch },
  process:     { bg: "from-emerald-50 to-white",     accent: "emerald",icon: Sparkles },
} as const;

const ACCENT: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  indigo:  { bg: "bg-indigo-600",  text: "text-indigo-600",  border: "border-indigo-200",  ring: "ring-indigo-200" },
  sky:     { bg: "bg-sky-600",     text: "text-sky-600",     border: "border-sky-200",     ring: "ring-sky-200" },
  amber:   { bg: "bg-amber-600",   text: "text-amber-700",   border: "border-amber-200",   ring: "ring-amber-200" },
  emerald: { bg: "bg-emerald-600", text: "text-emerald-600", border: "border-emerald-200", ring: "ring-emerald-200" },
};

export function SVGInfographic({ infographic, className }: SVGInfographicProps) {
  const { type, data, title } = infographic;
  const palette = PALETTES[type] ?? PALETTES.list;
  const accent = ACCENT[palette.accent];

  // ─── STAT: big number ───────────────────────────────────────────────
  if (type === "stat") {
    const value = String(data?.value ?? data?.percentage ?? data?.number ?? "—");
    const label = String(data?.label ?? "");
    const Icon: LucideIcon = palette.icon;
    return (
      <div
        className={cn(
          "rounded-2xl border bg-gradient-to-br p-6",
          palette.bg,
          accent.border,
          className
        )}
      >
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <div className="text-[88px] leading-none font-black bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tighter">
              {value}
            </div>
            {label && (
              <div className="mt-3 text-sm text-slate-700 font-medium leading-snug">
                {label}
              </div>
            )}
            {title && (
              <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                {title}
              </div>
            )}
          </div>
          <div className={cn("size-12 rounded-xl flex items-center justify-center text-white", accent.bg)}>
            <Icon className="size-6" />
          </div>
        </div>
      </div>
    );
  }

  // ─── QUOTE: pull-quote with giant opening mark ──────────────────────
  if (type === "quote") {
    const quote = String(data?.quote ?? "");
    const attribution = String(data?.author ?? data?.attribution ?? "");
    return (
      <div
        className={cn(
          "rounded-2xl border bg-gradient-to-br p-6",
          palette.bg,
          accent.border,
          className
        )}
      >
        <QuoteIcon className={cn("size-8 mb-2 opacity-50", accent.text)} />
        <p className="text-lg italic text-slate-800 leading-relaxed font-medium">
          &ldquo;{quote}&rdquo;
        </p>
        {attribution && (
          <p className={cn("mt-3 text-sm font-semibold", accent.text)}>
            — {attribution}
          </p>
        )}
        {title && (
          <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
            {title}
          </p>
        )}
      </div>
    );
  }

  // ─── LIST: numbered card grid ──────────────────────────────────────
  if (type === "list") {
    const items =
      (data?.items as string[] | undefined) ??
      (data?.categories as string[] | undefined) ??
      [];
    return (
      <div
        className={cn(
          "rounded-2xl border bg-gradient-to-br p-5",
          palette.bg,
          accent.border,
          className
        )}
      >
        {title && (
          <div className="flex items-center gap-2 mb-4">
            <div className={cn("size-6 rounded-md flex items-center justify-center text-white", accent.bg)}>
              <Layers className="size-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {title}
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg bg-white/80 border border-slate-200 px-3 py-2.5"
            >
              <span className={cn("size-7 rounded-md text-white text-xs font-bold flex items-center justify-center shrink-0", accent.bg)}>
                {i + 1}
              </span>
              <span className="text-sm text-slate-700 font-medium">{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── COMPARISON: two-column compare cards ──────────────────────────
  if (type === "comparison") {
    // Try multiple data shapes DeepSeek might return
    const leftLabel =
      String(data?.leftLabel ?? data?.autocratic ?? data?.laissez_faire ?? data?.a ?? "Option A");
    const rightLabel =
      String(data?.rightLabel ?? data?.democratic ?? data?.transformational ?? data?.b ?? "Option B");
    const leftValue = String(data?.left ?? data?.a_value ?? data?.speed_left ?? "");
    const rightValue = String(data?.right ?? data?.b_value ?? data?.speed_right ?? "");
    const leftSub = String(data?.leftSub ?? data?.autocratic_desc ?? "");
    const rightSub = String(data?.rightSub ?? data?.democratic_desc ?? "");

    return (
      <div className={cn("grid grid-cols-2 gap-3", className)}>
        {/* Left card */}
        <div className="rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-sm">
              {leftLabel.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              {leftLabel}
            </span>
          </div>
          {leftValue && (
            <p className="text-sm text-slate-800 font-semibold leading-relaxed">
              {leftValue}
            </p>
          )}
          {leftSub && (
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              {leftSub}
            </p>
          )}
        </div>
        {/* Right card */}
        <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm">
              {rightLabel.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              {rightLabel}
            </span>
          </div>
          {rightValue && (
            <p className="text-sm text-slate-800 font-semibold leading-relaxed">
              {rightValue}
            </p>
          )}
          {rightSub && (
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              {rightSub}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── PROCESS: horizontal step flow ─────────────────────────────────
  if (type === "process") {
    const steps =
      (data?.steps as string[] | undefined) ??
      (data?.items as string[] | undefined) ??
      [];
    const stepColors = [
      { bg: "from-emerald-500 to-emerald-600", text: "text-emerald-700" },
      { bg: "from-sky-500 to-sky-600",         text: "text-sky-700" },
      { bg: "from-amber-500 to-amber-600",     text: "text-amber-700" },
      { bg: "from-violet-500 to-violet-600",   text: "text-violet-700" },
      { bg: "from-rose-500 to-rose-600",       text: "text-rose-700" },
    ];

    return (
      <div
        className={cn(
          "rounded-2xl border bg-gradient-to-br p-5",
          palette.bg,
          accent.border,
          className
        )}
      >
        {title && (
          <div className="flex items-center gap-2 mb-4">
            <div className={cn("size-6 rounded-md flex items-center justify-center text-white", accent.bg)}>
              <GitBranch className="size-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {title}
            </span>
          </div>
        )}
        <div className="flex items-stretch">
          {steps.map((step, i) => {
            const color = stepColors[i % stepColors.length];
            return (
              <div key={i} className="flex items-stretch flex-1">
                <div className="flex-1 flex flex-col items-center text-center">
                  <div
                    className={cn(
                      "size-14 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center font-bold shadow-md",
                      color.bg
                    )}
                  >
                    {step.charAt(0).toUpperCase()}
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-900 leading-tight">
                    {step}
                  </div>
                  <div className={cn("text-[10px] mt-0.5 font-medium", color.text)}>
                    Step {i + 1}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex items-center px-1 text-slate-300 text-xl font-light">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Generic fallback ──────────────────────────────────────────────
  return (
    <div className={cn("mt-4 p-4 rounded-xl border border-border text-sm text-muted-foreground", className)}>
      {title ?? "Infographic"}
    </div>
  );
}
