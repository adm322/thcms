"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  Image as ImageIcon,
  BarChart3,
  Quote,
  GitCompare,
  Table2,
  Sparkles,
  ListChecks,
  Play,
  Code2,
} from "lucide-react";
import { SlideRenderer, resetSlideNumber } from "./SlideRenderer";
import { SlideViewer } from "./SlideViewer";
import { PresentationMode } from "./PresentationMode";
import type { Slide, SlideType, StructuredSlide } from "./slide-types";
import { isStructuredSlide } from "./slide-types";

interface SlideDeckProps {
  slidesJson: string;
  programTitle?: string;
  className?: string;
}

// Icon for each slide type — used in the thumbnail strip
const TYPE_ICONS: Record<SlideType, typeof LayoutTemplate> = {
  html: Code2,
  title: Sparkles,
  section: LayoutTemplate,
  bullets: ListChecks,
  metrics: BarChart3,
  compare: GitCompare,
  table: Table2,
  chart: BarChart3,
  quote: Quote,
  summary: Sparkles,
};

const TYPE_LABELS: Record<SlideType, string> = {
  html: "HTML",
  title: "Title",
  section: "Section",
  bullets: "Bullets",
  metrics: "Metrics",
  compare: "Compare",
  table: "Table",
  chart: "Chart",
  quote: "Quote",
  summary: "Summary",
};

export function SlideDeck({ slidesJson, programTitle, className }: SlideDeckProps) {
  let slides: Slide[] = [];
  try {
    const parsed = JSON.parse(slidesJson);
    if (Array.isArray(parsed)) {
      // Accept both new typed slides AND the legacy { index, title, bulletPoints } shape.
      // The SlideRenderer handles legacy → bullets internally.
      slides = parsed.filter(isAcceptableSlide);
    }
  } catch {
    slides = [];
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [imageFrequency, setImageFrequency] = useState<"all" | "half" | "none">("all");
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(0);
  const lastResetIndex = useRef(-1);

  // Persist the image frequency + autoplay choice per program (so the
  // trainer doesn't have to re-pick every time).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const k = `thcms:deckPref:${programTitle ?? "default"}`;
    try {
      const saved = window.localStorage.getItem(k);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.imageFrequency) setImageFrequency(parsed.imageFrequency);
        if (typeof parsed.autoAdvanceSeconds === "number") setAutoAdvanceSeconds(parsed.autoAdvanceSeconds);
      }
    } catch {
      /* ignore */
    }
  }, [programTitle]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const k = `thcms:deckPref:${programTitle ?? "default"}`;
    try {
      window.localStorage.setItem(
        k,
        JSON.stringify({ imageFrequency, autoAdvanceSeconds })
      );
    } catch {
      /* ignore */
    }
  }, [imageFrequency, autoAdvanceSeconds, programTitle]);

  // Reset the slide-number helper whenever the deck changes
  useEffect(() => {
    resetSlideNumber();
    lastResetIndex.current = -1;
  }, [slidesJson]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Keyboard navigation (only when no input is focused)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  if (slides.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm text-center px-8">
          No slides generated yet. Upload content to generate slides.
        </div>
      </div>
    );
  }

  const current = slides[currentIndex];
  const currentType = current && "type" in current ? current.type : undefined;
  const TypeIcon = currentType ? TYPE_ICONS[currentType] : LayoutTemplate;

  return (
    <div className={className}>
      {/* Deck controls toolbar — above the deck */}
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-3 py-2">
        {/* Image frequency */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
            Images:
          </span>
          {(["all", "half", "none"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setImageFrequency(opt)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded transition ${
                imageFrequency === opt
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
              aria-pressed={imageFrequency === opt}
            >
              {opt === "all" ? "All" : opt === "half" ? "Half" : "None"}
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
        {/* Autoplay interval */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
            Auto:
          </span>
          {([0, 5, 10, 20, 30] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setAutoAdvanceSeconds(s)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded transition ${
                autoAdvanceSeconds === s
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
              aria-pressed={autoAdvanceSeconds === s}
            >
              {s === 0 ? "Off" : `${s}s`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 h-full">
        {/* Left thumbnail strip */}
        <div className="flex flex-col gap-2 w-16 shrink-0 overflow-y-auto max-h-[500px] pr-1">
          {slides.map((slide, i) => {
            const slideType = slide && "type" in slide ? slide.type : undefined;
            const Icon = slideType ? TYPE_ICONS[slideType] : LayoutTemplate;
            const isActive = i === currentIndex;
            return (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}: ${slideType ? TYPE_LABELS[slideType] : "Slide"}`}
                aria-current={isActive ? "step" : undefined}
                className={`
                  group relative shrink-0 rounded-lg border-2 transition-all
                  flex flex-col items-center justify-center gap-0.5 py-1.5
                  ${isActive
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:border-indigo-300 hover:bg-indigo-50/50"
                  }
                `}
              >
                <Icon className="size-3.5" />
                <span className="text-[10px] font-bold tabular-nums">{i + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Main slide area */}
        <div className="flex-1 min-w-0">
          {isStructuredSlide(current) ? (
            <SlideViewer
              slide={{
                index: currentIndex,
                title: current.title,
                bulletPoints: current.bulletPoints,
                infographic: current.infographic as { type: "stat"|"quote"|"list"|"comparison"|"process"; title?: string; data?: Record<string, unknown> } | undefined,
                speakerNotes: current.speakerNotes,
              }}
              totalSlides={slides.length}
              programTitle={programTitle}
            />
          ) : (
            <SlideRenderer
              slide={current}
              totalSlides={slides.length}
              programTitle={programTitle}
            />
          )}

          {/* Bottom nav */}
          <div className="flex items-center justify-between mt-4 px-1">
            <Button
              variant="outline"
              size="icon"
              onClick={goPrev}
              disabled={currentIndex === 0}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <TypeIcon className="size-3" />
                {currentType ? TYPE_LABELS[currentType] : "Slide"}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400 font-semibold tabular-nums">
                {currentIndex + 1} / {slides.length}
              </span>
              <div className="w-32 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goNext}
              disabled={currentIndex === slides.length - 1}
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => setPresenting(true)}
              className="ml-1"
              aria-label="Enter presentation mode"
            >
              <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
              Present
            </Button>
          </div>
        </div>
      </div>

      {/* Fullscreen presentation mode (mounted only while active) */}
      {presenting ? (
        <PresentationMode
          slides={slides}
          programTitle={programTitle}
          startIndex={currentIndex}
          onClose={() => setPresenting(false)}
          autoAdvanceSeconds={autoAdvanceSeconds}
          imageFrequency={imageFrequency}
        />
      ) : null}
    </div>
  );
}

/** Accepts both new typed slides and the legacy { index, title, bulletPoints } shape. */
function isAcceptableSlide(v: unknown): v is Slide {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  // New shape (v3+): a string `html` field
  if (typeof o.html === "string" && o.html.length > 0) return true;
  // Legacy discriminated shape: a `type` field we recognize
  if (typeof o.type === "string" && o.type in TYPE_ICONS) return true;
  // Legacy: has title + bulletPoints
  if (typeof o.title === "string" && Array.isArray(o.bulletPoints)) return true;
  if (typeof o.title === "string") return true;
  return false;
}
