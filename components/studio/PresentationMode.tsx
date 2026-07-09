"use client";

/**
 * PresentationMode — fullscreen slide viewer.
 *
 * Behavior:
 *   - Scales the slide to fill the viewport (maintaining 16:9 aspect ratio)
 *   - Arrow keys / Space / Page Down → next; Backspace / Page Up → prev
 *   - F → toggle browser fullscreen
 *   - ESC → exit presentation mode
 *   - Auto-hides chrome; mouse-move shows it briefly
 *   - Bottom progress bar; side navigation dots
 *   - Slide number + title in the corner
 *
 * Triggered from the parent by setting `presenting=true`.
 */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  StickyNote,
  CircleDot,
} from "lucide-react";
import { SlideRenderer, resetSlideNumber } from "./SlideRenderer";
import type { Slide } from "./slide-types";

export type ImageFrequency = "all" | "half" | "none";

interface PresentationModeProps {
  slides: Slide[];
  programTitle?: string;
  startIndex?: number;
  onClose: () => void;
  /** Auto-advance every N seconds. 0 = off (default). */
  autoAdvanceSeconds?: number;
  /** Image frequency preset from the deck. */
  imageFrequency?: ImageFrequency;
}

export function PresentationMode({
  slides,
  programTitle,
  startIndex = 0,
  onClose,
  autoAdvanceSeconds = 0,
  imageFrequency = "all",
}: PresentationModeProps) {
  const [index, setIndex] = useState(startIndex);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoPlaying, setAutoPlaying] = useState(autoAdvanceSeconds > 0);
  const [secondsLeft, setSecondsLeft] = useState(autoAdvanceSeconds);
  const [showNotes, setShowNotes] = useState(false);
  const [laserDots, setLaserDots] = useState<{ x: number; y: number; id: number }[]>([]);

  // Apply image frequency: strip imageUrl on alternate slides for "half",
  // strip all for "none". We do this in derived state to keep the original
  // data intact.
  const filteredSlides = useMemo(() => {
    if (imageFrequency === "all") return slides;
    return slides.map((s, i) => {
      if (!("imageUrl" in s) || !s.imageUrl) return s;
      if (imageFrequency === "none" || i % 2 === 0) {
        // Strip image but keep everything else
        const { imageUrl: _drop, ...rest } = s as unknown as { imageUrl: string };
        return rest as unknown as Slide;
      }
      return s;
    });
  }, [slides, imageFrequency]);

  const total = filteredSlides.length;
  const current = filteredSlides[index];

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, total - 1));
    resetSlideNumber();
  }, [total]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
    resetSlideNumber();
  }, []);

  // Reset slide numbering whenever the deck or current index changes
  useEffect(() => {
    resetSlideNumber();
  }, [slides, index]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // P toggles speaker notes (presenter view)
      if (e.key === "p" || e.key === "P") {
        if (e.metaKey || e.ctrlKey) return; // don't trap browser shortcuts
        e.preventDefault();
        setShowNotes((v) => !v);
        return;
      }
      // T toggles autoplay
      if (e.key === "t" || e.key === "T") {
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        setAutoPlaying((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown" || e.key === "n") {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "Backspace" || e.key === "p" && false) {
        e.preventDefault();
        goPrev();
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        setIndex(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        setIndex(total - 1);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, total, onClose]);

  // Auto-advance timer
  useEffect(() => {
    if (!autoPlaying || autoAdvanceSeconds <= 0) {
      setSecondsLeft(autoAdvanceSeconds);
      return;
    }
    setSecondsLeft(autoAdvanceSeconds);
    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // advance slide
          setIndex((i) => (i + 1) % total);
          return autoAdvanceSeconds;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [autoPlaying, autoAdvanceSeconds, total]);

  // Laser pointer: Alt+click drops a temporary dot for 2 seconds
  const laserIdRef = useRef(0);
  const handleSlideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!e.altKey) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = ++laserIdRef.current;
    setLaserDots((prev) => [...prev, { x, y, id }]);
    setTimeout(() => {
      setLaserDots((prev) => prev.filter((d) => d.id !== id));
    }, 2000);
  };

  // Auto-hide chrome on mouse idle
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const onMouseMove = () => {
      setChromeVisible(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setChromeVisible(false), 2500);
    };
    onMouseMove();
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-label="Presentation mode"
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col"
    >
      {/* Slide area — scales the 16:9 frame to fit the viewport */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12 min-h-0">
        <div
          className="relative w-full max-w-[min(100vw-2rem,calc((100vh-12rem)*16/9))]"
          style={{ aspectRatio: "16 / 9" }}
          onClick={handleSlideClick}
        >
          {/* The `slide` prop type is the discriminated union, which TS
              narrows lazily — renderer's prop type is correct. */}
          <SlideRenderer
            slide={current}
            totalSlides={total}
            programTitle={programTitle}
            className="absolute inset-0"
          />
        </div>
      </div>

      {/* Chrome overlay (auto-hides on mouse idle) */}
      <div
        className={`pointer-events-none transition-opacity duration-300 ${
          chromeVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top bar: title + close */}
        <div className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-auto">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Presentation Mode
              {imageFrequency !== "all" ? ` · images: ${imageFrequency}` : ""}
            </p>
            <p className="text-sm font-semibold text-white truncate max-w-md">
              {current && "title" in current && current.title
                ? current.title
                : programTitle ?? "Slide deck"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {autoAdvanceSeconds > 0 ? (
              <button
                type="button"
                onClick={() => setAutoPlaying((v) => !v)}
                className={`size-9 rounded-lg flex items-center justify-center transition ${
                  autoPlaying
                    ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
                aria-label={autoPlaying ? "Pause autoplay (T)" : "Resume autoplay (T)"}
                title={`${autoPlaying ? "Pause" : "Resume"} (T)`}
              >
                {autoPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowNotes((v) => !v)}
              className={`size-9 rounded-lg flex items-center justify-center transition ${
                showNotes
                  ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              aria-label={showNotes ? "Hide notes (P)" : "Show notes (P)"}
              title={`${showNotes ? "Hide" : "Show"} notes (P)`}
            >
              <StickyNote className="size-4" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="size-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen (F or Esc)" : "Fullscreen (F)"}
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="size-9 rounded-lg bg-white/10 hover:bg-rose-500 text-white flex items-center justify-center transition"
              aria-label="Exit presentation (Esc)"
              title="Exit (Esc)"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Laser pointer dots (Alt+click) */}
        {laserDots.map((d) => (
          <div
            key={d.id}
            className="absolute pointer-events-none"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              transform: "translate(-50%, -50%)",
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.85)",
              boxShadow: "0 0 12px rgba(239, 68, 68, 0.8)",
              animation: "laserFade 2s ease-out forwards",
            }}
          />
        ))}

        {/* Speaker notes panel (P toggles) */}
        {showNotes && current && "speakerNotes" in current && current.speakerNotes ? (
          <div className="absolute bottom-16 left-6 right-6 max-h-[35%] overflow-y-auto rounded-xl bg-amber-500/15 border border-amber-400/30 backdrop-blur-sm p-4 pointer-events-auto">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className="size-3.5 text-amber-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                Speaker Notes
              </span>
            </div>
            <p className="text-sm text-white leading-relaxed">{current.speakerNotes}</p>
          </div>
        ) : null}

        {/* Bottom bar: prev / progress / next + slide counter */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-4 flex items-center gap-4 bg-gradient-to-t from-black/60 to-transparent pointer-events-auto">
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            className="size-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center transition"
            aria-label="Previous slide (←)"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs text-slate-300 font-bold tabular-nums">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-500 rounded-full"
                style={{ width: `${((index + 1) / total) * 100}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={goNext}
            disabled={index === total - 1}
            className="size-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center transition"
            aria-label="Next slide (→ or Space)"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {/* Click anywhere left/right of the slide to navigate */}
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-0 top-12 bottom-12 w-32 z-10 cursor-w-resize"
          aria-label="Previous slide"
          tabIndex={-1}
        />
        <button
          type="button"
          onClick={goNext}
          className="absolute right-0 top-12 bottom-12 w-32 z-10 cursor-e-resize"
          aria-label="Next slide"
          tabIndex={-1}
        />
      </div>

      {/* Floating autoplay countdown ring (bottom-right) */}
      {autoPlaying && autoAdvanceSeconds > 0 ? (
        <div
          className="fixed bottom-20 right-6 z-10 pointer-events-auto"
          aria-live="polite"
        >
          <div
            className="relative size-12 flex items-center justify-center rounded-full bg-slate-900/70 backdrop-blur-sm border border-emerald-400/40 text-emerald-300 font-bold tabular-nums"
            title={`Auto-advancing in ${secondsLeft}s · press T to pause`}
          >
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeOpacity="0.2"
              />
              <circle
                cx="18" cy="18" r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={`${(secondsLeft / autoAdvanceSeconds) * 100} 100`}
                strokeLinecap="round"
                className="text-emerald-400"
              />
            </svg>
            <span className="relative text-sm">{secondsLeft}</span>
          </div>
        </div>
      ) : null}

      {/* Tiny keyboard hint badge (bottom-left) */}
      <div className="fixed bottom-3 left-3 z-10 text-[10px] text-white/40 pointer-events-none select-none">
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono">← →</kbd>
        {" "}navigate ·{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono">P</kbd>
        {" "}notes ·{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono">F</kbd>
        {" "}fullscreen ·{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono">Esc</kbd>
        {" "}exit
      </div>

      {/* Inline keyframes for the laser pointer fade-out */}
      <style jsx global>{`
        @keyframes laserFade {
          0%   { transform: translate(-50%, -50%) scale(1.0); opacity: 1; }
          70%  { transform: translate(-50%, -50%) scale(1.0); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
