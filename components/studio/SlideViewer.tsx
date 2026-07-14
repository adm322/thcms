"use client";

/**
 * SlideViewer — renders a single slide in a branded 16:9 presentation style.
 * Includes:
 *  - Top brand bar (TH logo + "TrainHub Studio" + module name)
 *  - Section eyebrow + bold title
 *  - Numbered bullet cards
 *  - Infographic area (delegates to SVGInfographic)
 *  - Speaker notes collapsible at the bottom
 *  - Slide number badge
 */

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { SVGInfographic, type Infographic } from "./SVGInfographic";

export interface Slide {
  index: number;
  title: string;
  bulletPoints: string[];
  infographic?: Infographic;
  speakerNotes?: string;
}

interface SlideViewerProps {
  slide: Slide;
  totalSlides?: number;
  programTitle?: string;
  className?: string;
}

const SECTION_LABELS: Record<string, string> = {
  "Leadership Fundamentals": "Module 1 · Introduction",
  "What is Leadership?": "Module 1 · Foundations",
  "Key Leadership Styles": "Module 1 · Styles",
  "Autocratic": "Module 1 · Styles",
  "Laissez-faire": "Module 1 · Styles",
  "GROW Model": "Module 2 · Coaching",
  "Emotional Intelligence": "Module 3 · EQ",
};

function detectSection(title: string): string {
  for (const key of Object.keys(SECTION_LABELS)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return SECTION_LABELS[key];
    }
  }
  return "Module · Insights";
}

export function SlideViewer({ slide, totalSlides, programTitle, className }: SlideViewerProps) {
  const [showNotes, setShowNotes] = useState(false);
  const section = detectSection(slide.title);

  return (
    <div
      className={
        "relative w-full aspect-[16/9] bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col " +
        (className ?? "")
      }
    >
      {/* Subtle grid background pattern */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6366f1" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Top brand bar */}
      <div className="relative z-10 px-7 pt-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[11px] font-black tracking-tight">
            TH
          </div>
          <span className="text-xs font-semibold text-slate-600">TrainHub Studio</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium truncate max-w-[50%]">
          {programTitle ?? "Learning Module"}
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 px-7 py-5 flex flex-col min-h-0">
        {/* Section eyebrow + title */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="size-3.5 text-indigo-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
            {section}
          </span>
        </div>
        <h1 className="text-[28px] leading-tight font-bold text-slate-900 tracking-tight">
          {slide.title}
        </h1>

        {/* Bullets + infographic side by side when both exist */}
        {slide.bulletPoints.length > 0 && slide.infographic ? (
          <div className="mt-4 grid grid-cols-5 gap-5 flex-1 min-h-0">
            <ul className="col-span-2 space-y-2.5 overflow-y-auto">
              {slide.bulletPoints.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[13px] text-slate-700 leading-relaxed"
                >
                  <span className="size-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{point}</span>
                </li>
              ))}
            </ul>
            <div className="col-span-3 flex items-center overflow-y-auto">
              <div className="w-full">
                <SVGInfographic infographic={slide.infographic} />
              </div>
            </div>
          </div>
        ) : slide.bulletPoints.length > 0 ? (
          <ul className="mt-4 space-y-2.5 flex-1 overflow-y-auto">
            {slide.bulletPoints.map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[14px] text-slate-700 leading-relaxed"
              >
                <span className="size-7 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="pt-1">{point}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Infographic alone (no bullets) */}
        {!slide.bulletPoints.length && slide.infographic && (
          <div className="mt-4 flex-1 flex items-center overflow-y-auto">
            <div className="w-full">
              <SVGInfographic infographic={slide.infographic} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar: speaker notes toggle + slide number */}
      <div className="relative z-10 px-7 py-2.5 flex items-center justify-between border-t border-slate-100 shrink-0">
        {slide.speakerNotes ? (
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-900 transition"
          >
            {showNotes ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
            {showNotes ? "Hide" : "Show"} speaker notes
          </button>
        ) : (
          <span />
        )}
        <span className="text-[10px] text-slate-400 font-semibold tabular-nums">
          {String(slide.index + 1).padStart(2, "0")} / {totalSlides ? String(totalSlides).padStart(2, "0") : "—"}
        </span>
      </div>

      {/* Speaker notes panel */}
      {showNotes && slide.speakerNotes && (
        <div className="relative z-10 bg-slate-50 border-t border-slate-200 px-7 py-3 text-[12px] text-slate-700 leading-relaxed max-h-[30%] overflow-y-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
            Speaker Notes
          </span>
          {slide.speakerNotes}
        </div>
      )}
    </div>
  );
}
