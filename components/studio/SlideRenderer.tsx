"use client";

/**
 * SlideRenderer — mounts AI-generated slide HTML via dangerouslySetInnerHTML.
 *
 * The AI (see lib/prompts.ts buildSlidePrompt) returns an array of slides
 * with a `html` field (a self-contained <section class='slide'>). This
 * component wraps that in a styled 16:9 frame, runs a small CSS reset
 * (so AI-generated `width: 600px` divs can't break out), and applies the
 * TrainHub chrome (brand bar top, slide number bottom, optional speaker
 * notes).
 *
 * Legacy discriminated-union slides still get rendered via
 * `legacySlideToHtml` for back-compat with any pre-existing data.
 *
 * Fonts are scaled via cqw (container query units) on a `containerType:
 * size` wrapper — the AI HTML can use cqw freely and the slide scales
 * with the viewport in both the deck and presentation mode.
 */

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { Slide, HtmlSlide, LegacySlide } from "./slide-types";
import { isHtmlSlide } from "./slide-types";

const FRAME =
  "w-full aspect-[16/9] rounded-2xl overflow-hidden flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl";

const SLIDE_CSS = `
  .slide {
    width: 100%;
    height: 100%;
    padding: 3cqw 4cqw;
    box-sizing: border-box;
    font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #1e293b;
    line-height: 1.4;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
  }
  .slide *,
  .slide *::before,
  .slide *::after { box-sizing: border-box; max-width: 100%; }
  .slide h1 {
    font-size: 5.5cqw;
    font-weight: 800;
    line-height: 1.05;
    margin: 0 0 0.5em;
    color: #6366f1;
    letter-spacing: -0.02em;
  }
  .slide h2 {
    font-size: 3.2cqw;
    font-weight: 700;
    line-height: 1.15;
    margin: 0.6em 0 0.4em;
    color: #4f46e5;
  }
  .slide h3 {
    font-size: 2.4cqw;
    font-weight: 700;
    line-height: 1.2;
    margin: 0.5em 0 0.3em;
    color: #4338ca;
  }
  .slide p, .slide li {
    font-size: 1.9cqw;
    line-height: 1.45;
    margin: 0.35em 0;
    color: #334155;
  }
  .slide ul, .slide ol {
    padding-left: 3.5cqw;
    margin: 0.5em 0;
  }
  .slide li { margin: 0.5em 0; }
  .slide blockquote {
    font-size: 2.8cqw;
    font-style: italic;
    color: #475569;
    border-left: 6px solid #6366f1;
    padding: 0.8cqw 0 0.8cqw 2cqw;
    margin: 1cqw 0;
  }
  .slide img {
    max-width: 100%;
    max-height: 50cqh;
    object-fit: cover;
    border-radius: 12px;
  }
  .slide figure { margin: 0; }
  .slide table {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.6cqw;
  }
  .slide th, .slide td {
    padding: 0.4cqw 0.6cqw;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  .slide th {
    font-weight: 700;
    color: #1e293b;
    background: #f8fafc;
  }
  .slide strong { font-weight: 700; color: #1e293b; }
  .slide em { font-style: italic; }
  .dark .slide { color: #e2e8f0; }
  .dark .slide p, .dark .slide li, .dark .slide td { color: #cbd5e1; }
  .dark .slide th { color: #e2e8f0; background: #1e293b; border-bottom-color: #334155; }
  .dark .slide td { border-bottom-color: #334155; }
  .dark .slide blockquote { color: #cbd5e1; }
  .dark .slide strong { color: #f1f5f9; }
  .slide em { font-style: italic; }
`;

export type { Slide };

interface SlideRendererProps {
  slide: Slide;
  totalSlides?: number;
  programTitle?: string;
  className?: string;
}

export function SlideRenderer({
  slide,
  totalSlides,
  programTitle,
  className,
}: SlideRendererProps) {
  // Derive the HTML to render and the slide number / notes from whichever
  // shape we have (new HTML or legacy discriminated).
  const html = isHtmlSlide(slide)
    ? slide.html
    : legacySlideToHtml(slide as LegacySlide);
  const sanitized = sanitizeRenderedHtml(html);
  const notes = "speakerNotes" in slide ? (slide as { speakerNotes?: string }).speakerNotes : undefined;
  const slideNumber = isHtmlSlide(slide) ? `s${(slide as { __num?: number }).__num ?? ""}` : "•";
  const [showNotes, setShowNotes] = useState(false);

  // Inject the slide base CSS into the document head once. The CSS is
  // scoped via the .slide class on each AI-generated section, so there's
  // no risk of leaking.
  useEffect(() => {
    const id = "slide-renderer-base-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = SLIDE_CSS;
    document.head.appendChild(el);
  }, []);

  return (
    <div className={`${FRAME} ${className ?? ""}`}>
      {/* Brand bar */}
      <div className="relative z-10 px-4 pt-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="size-5 rounded bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold">
            TH
          </div>
          {programTitle ? (
            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
              {programTitle}
            </span>
          ) : null}
        </div>
        {totalSlides ? (
          <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 tabular-nums">
            {slideNumber} / {totalSlides}
          </span>
        ) : null}
      </div>

      {/* The AI-generated slide HTML */}
      <div
        className="relative z-10 flex-1 min-h-0 overflow-hidden"
        style={{ containerType: "size" }}
        dangerouslySetInnerHTML={{ __html: sanitized }} />

      {/* Bottom bar: optional speaker notes toggle + small footer */}
      <div className="relative z-10 px-4 py-1.5 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800/60 shrink-0">
        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-700">
          TrainHub Studio
        </span>
        {notes ? (
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className="text-[10px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1"
            aria-label={showNotes ? "Hide speaker notes" : "Show speaker notes"}
          >
            {showNotes ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
            Notes
          </button>
        ) : null}
      </div>

      {/* Speaker notes panel */}
      {showNotes && notes ? (
        <div className="relative z-10 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200/60 dark:border-amber-800/40 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-[40%] overflow-y-auto">
          <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
            <Sparkles className="size-2.5" /> Speaker Notes
          </p>
          {notes}
        </div>
      ) : null}

    </div>
  );
}

/* SLIDE_CSS is declared in a separate const below the function */

/**
 * Strip dangerous HTML the AI might emit. Defenses:
 * - <script> tags (with all content)
 * - <style> tags (we want our own reset to win)
 * - on* event handlers
 * - javascript: and data:text/html URLs
 * Keeps the actual semantic HTML.
 */
function sanitizeRenderedHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data\s*:\s*text\/html/gi, "");
}

/**
 * Convert a legacy discriminated slide shape to a self-contained HTML
 * string. Used for back-compat with pre-v3 data. New data is always
 * stored as the new HtmlSlide shape.
 */
function legacySlideToHtml(s: LegacySlide): string {
  const escape = (str: string) =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  switch (s.type) {
    case "title":
      return `<section class="slide" style="text-align:center;background:linear-gradient(135deg,#eef2ff 0%,#f8fafc 100%);">
        <div style="margin-bottom:2cqw;">
          <div style="display:inline-block;background:#6366f1;color:#fff;padding:0.6cqw 1.4cqw;border-radius:8px;font-size:1.4cqw;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">TrainHub Studio</div>
        </div>
        <h1>${escape(s.title)}</h1>
        ${s.subtitle ? `<p style="font-size:2.2cqw;color:#64748b;">${escape(s.subtitle)}</p>` : ""}
        ${s.presenter || s.date ? `<p style="margin-top:2cqw;font-size:1.4cqw;color:#94a3b8;">${s.presenter ? escape(s.presenter) : ""}${s.presenter && s.date ? " · " : ""}${s.date ? escape(s.date) : ""}</p>` : ""}
      </section>`;

    case "section":
      return `<section class="slide" style="text-align:center;background:linear-gradient(135deg,#eef2ff 0%,#f8fafc 60%,#ffffff 100%);">
        <p style="display:inline-block;background:#6366f1;color:#fff;padding:0.5cqw 1.2cqw;border-radius:6px;font-size:1.3cqw;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:1.5cqw;">Section ${escape(s.sectionNumber)}</p>
        <h1>${escape(s.title)}</h1>
        ${s.subtitle ? `<p style="font-size:2cqw;color:#64748b;max-width:70%;margin:0 auto;">${escape(s.subtitle)}</p>` : ""}
      </section>`;

    case "bullets":
      return `<section class="slide">
        <h1>${escape(s.title)}</h1>
        <ol>${s.bullets.map((b) => `<li>${escape(b)}</li>`).join("")}</ol>
      </section>`;

    case "metrics":
      return `<section class="slide">
        <h1>${escape(s.title)}</h1>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(20%,1fr));gap:1.5cqw;margin-top:1.5cqw;">
          ${s.metrics.map((m) => `<div style="text-align:center;background:#f8fafc;border:1px solid #e2e8f0;padding:1.5cqw 1cqw;border-radius:12px;">
            <p style="font-size:5cqw;font-weight:800;line-height:1;color:#6366f1;margin:0;">${escape(m.value)}</p>
            <p style="font-size:1.5cqw;color:#64748b;margin:0.5cqw 0 0;">${escape(m.label)}</p>
          </div>`).join("")}
        </div>
        ${s.caption ? `<p style="margin-top:1.5cqw;font-size:1.5cqw;color:#64748b;font-style:italic;">${escape(s.caption)}</p>` : ""}
      </section>`;

    case "compare":
      return `<section class="slide">
        <h1>${escape(s.title)}</h1>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5cqw;flex:1;">
          <div style="background:#fef2f2;border:2px solid #fca5a5;padding:1.5cqw;border-radius:14px;">
            <h2 style="color:#dc2626;margin:0 0 0.5em;font-size:2.2cqw;">${escape(s.leftHeading)}</h2>
            <ul style="padding-left:2.5cqw;font-size:1.8cqw;color:#7f1d1d;line-height:1.4;margin:0;">${s.leftPoints.map((p) => `<li style="margin:0.4em 0;">${escape(p)}</li>`).join("")}</ul>
          </div>
          <div style="background:#f0fdf4;border:2px solid #86efac;padding:1.5cqw;border-radius:14px;">
            <h2 style="color:#16a34a;margin:0 0 0.5em;font-size:2.2cqw;">${escape(s.rightHeading)}</h2>
            <ul style="padding-left:2.5cqw;font-size:1.8cqw;color:#14532d;line-height:1.4;margin:0;">${s.rightPoints.map((p) => `<li style="margin:0.4em 0;">${escape(p)}</li>`).join("")}</ul>
          </div>
        </div>
      </section>`;

    case "table":
      return `<section class="slide">
        <h1>${escape(s.title)}</h1>
        <table>
          <thead><tr>${s.headers.map((h) => `<th>${escape(h)}</th>`).join("")}</tr></thead>
          <tbody>${s.rows.map((r) => `<tr>${r.map((c) => `<td>${escape(c)}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </section>`;

    case "quote":
      return `<section class="slide" style="text-align:center;justify-content:center;">
        <blockquote style="max-width:80%;margin:0 auto;">${escape(s.text)}</blockquote>
        ${s.attribution ? `<p style="font-size:1.6cqw;color:#94a3b8;margin-top:1.5cqw;">— ${escape(s.attribution)}</p>` : ""}
      </section>`;

    case "summary":
      return `<section class="slide">
        <h1>${escape(s.title)}</h1>
        <ul>${s.takeaways.map((t) => `<li>${escape(t)}</li>`).join("")}</ul>
        ${s.closingMessage ? `<p style="margin-top:1.5cqw;font-size:1.8cqw;color:#6366f1;font-style:italic;text-align:center;">${escape(s.closingMessage)}</p>` : ""}
      </section>`;

    case "chart":
      return `<section class="slide">
        <h1>${escape(s.title)}</h1>
        <p style="text-align:center;color:#64748b;margin-top:2cqw;">Chart placeholder · ${s.data.length} data points · ${s.chartType}</p>
      </section>`;

    default:
      return `<section class="slide"><h1>Slide</h1></section>`;
  }
}

/** Reset the slide number counter (called by SlideDeck on slides change). */
export function resetSlideNumber(): void {
  // No-op in the new HTML-based renderer; kept as an export for back-compat.
}
