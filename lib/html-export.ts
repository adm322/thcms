/**
 * Self-contained HTML export for the Learning Studio.
 *
 * Generates a standalone HTML file that includes all slides, CSS,
 * and JavaScript for a complete offline-viewable presentation.
 */

import type { Slide, HtmlSlide } from "@/components/studio/slide-types";

/**
 * Generate a self-contained HTML file with all slides embedded.
 * The output is a single .html file that can be opened in any browser
 * and navigated with arrow keys.
 */
export async function generateHtmlBundle(
  slides: Slide[],
  programTitle: string = "Training Presentation"
): Promise<string> {
  const slidesHtml = slides
    .map((slide, i) => {
      const html = (slide as HtmlSlide).html ?? "";
      const notes =
        "speakerNotes" in slide
          ? (slide as { speakerNotes?: string }).speakerNotes ?? ""
          : "";
      return `
    <!-- Slide ${i + 1} -->
    <div class="slide-wrapper" id="slide-${i}">
      <div class="slide-frame">
        ${html}
      </div>
      ${notes ? `<div class="speaker-notes">${escapeHtml(notes)}</div>` : ""}
      <div class="slide-footer">
        <span>TrainHub Studio</span>
        <span>${i + 1} / ${slides.length}</span>
      </div>
    </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(programTitle)} — TrainHub Studio</title>
<style>
  /* ── Reset & Base ─────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; overflow: hidden; font-family: Inter, system-ui, -apple-system, sans-serif; }
  body { background: #0f172a; color: #e2e8f0; display: flex; flex-direction: column; }

  /* ── Slide Container ──────────────────────────────────────── */
  #slide-container {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 1rem; min-height: 0;
  }
  .slide-wrapper {
    display: none;
    width: 100%; max-width: min(100vw - 2rem, calc((100vh - 8rem) * 16 / 9));
    aspect-ratio: 16 / 9;
    flex-direction: column;
  }
  .slide-wrapper.active { display: flex; }

  .slide-frame {
    flex: 1; overflow: hidden; border-radius: 16px;
    background: #fff; color: #1e293b;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    container-type: size;
  }

  /* ── Slide Content Styles (mirrors SlideRenderer) ────────── */
  .slide { width:100%; height:100%; padding:3cqw 4cqw; box-sizing:border-box; font-family:Inter,system-ui,sans-serif; color:#1e293b; line-height:1.4; display:flex; flex-direction:column; justify-content:center; overflow:hidden; }
  .slide h1 { font-size:5.5cqw; font-weight:800; line-height:1.05; margin:0 0 0.5em; color:#6366f1; letter-spacing:-0.02em; }
  .slide h2 { font-size:3.2cqw; font-weight:700; line-height:1.15; margin:0.6em 0 0.4em; color:#4f46e5; }
  .slide h3 { font-size:2.4cqw; font-weight:700; line-height:1.2; margin:0.5em 0 0.3em; color:#4338ca; }
  .slide p, .slide li { font-size:1.9cqw; line-height:1.45; margin:0.35em 0; color:#334155; }
  .slide ul, .slide ol { padding-left:3.5cqw; margin:0.5em 0; }
  .slide li { margin:0.5em 0; }
  .slide blockquote { font-size:2.8cqw; font-style:italic; color:#475569; border-left:6px solid #6366f1; padding:0.8cqw 0 0.8cqw 2cqw; margin:1cqw 0; }
  .slide img { max-width:100%; max-height:50cqh; object-fit:cover; border-radius:12px; }
  .slide figure { margin:0; }
  .slide table { width:100%; border-collapse:collapse; font-size:1.6cqw; }
  .slide th, .slide td { padding:0.4cqw 0.6cqw; text-align:left; border-bottom:1px solid #e2e8f0; }
  .slide th { font-weight:700; color:#1e293b; background:#f8fafc; }
  .slide strong { font-weight:700; color:#1e293b; }
  .slide em { font-style:italic; }

  .slide-footer {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.25rem 0.5rem; font-size: 10px; color: #64748b;
    font-weight: 600;
  }
  .speaker-notes {
    margin-top: 0.25rem; padding: 0.5rem 0.75rem;
    background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 8px; font-size: 11px; color: #fbbf24;
    max-height: 20%; overflow-y: auto; display: none;
  }
  .speaker-notes.visible { display: block; }

  /* ── Controls Bar ─────────────────────────────────────────── */
  #controls {
    display: flex; align-items: center; justify-content: center; gap: 1rem;
    padding: 0.75rem 1rem; background: rgba(15, 23, 42, 0.95);
    border-top: 1px solid #1e293b;
  }
  #controls button {
    background: rgba(255,255,255,0.1); border: none; color: #e2e8f0;
    width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; transition: background 0.15s;
  }
  #controls button:hover { background: rgba(255,255,255,0.2); }
  #controls button:disabled { opacity: 0.3; cursor: default; }
  #slide-counter { font-size: 12px; font-weight: 700; color: #94a3b8; min-width: 60px; text-align: center; font-variant-numeric: tabular-nums; }
  #progress-bar { flex: 1; max-width: 200px; height: 4px; background: #1e293b; border-radius: 2px; overflow: hidden; }
  #progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 2px; transition: width 0.3s; }
  #toggle-notes { font-size: 11px !important; width: auto !important; border-radius: 8px !important; padding: 0 10px !important; }

  /* ── Print Styles ─────────────────────────────────────────── */
  @media print {
    html, body { height: auto; overflow: visible; background: white; }
    #controls { display: none; }
    .slide-wrapper { display: flex !important; break-after: page; max-width: 100%; aspect-ratio: auto; height: auto; }
    .slide-frame { box-shadow: none; border: 1px solid #e2e8f0; }
    .speaker-notes { display: block !important; background: none; border: 1px dashed #ccc; color: #666; }
    .slide-footer { color: #999; }
  }
</style>
</head>
<body>
  <div id="slide-container">
${slidesHtml}
  </div>
  <div id="controls">
    <button id="btn-prev" title="Previous (←)" disabled>&larr;</button>
    <span id="slide-counter">1 / ${slides.length}</span>
    <div id="progress-bar"><div id="progress-fill" style="width:${slides.length > 0 ? (100 / slides.length).toFixed(1) : 0}%"></div></div>
    <button id="btn-next" title="Next (→)">&rarr;</button>
    <button id="toggle-notes" title="Toggle speaker notes (P)">Notes</button>
  </div>
  <script>
    (function() {
      var slides = document.querySelectorAll('.slide-wrapper');
      var total = slides.length;
      var current = 0;
      var notesVisible = false;

      function show(idx) {
        slides.forEach(function(s) { s.classList.remove('active'); });
        if (slides[idx]) slides[idx].classList.add('active');
        document.getElementById('slide-counter').textContent = (idx + 1) + ' / ' + total;
        document.getElementById('progress-fill').style.width = ((idx + 1) / total * 100) + '%';
        document.getElementById('btn-prev').disabled = idx === 0;
        document.getElementById('btn-next').disabled = idx === total - 1;
        current = idx;
      }

      document.getElementById('btn-prev').addEventListener('click', function() {
        if (current > 0) show(current - 1);
      });
      document.getElementById('btn-next').addEventListener('click', function() {
        if (current < total - 1) show(current + 1);
      });
      document.getElementById('toggle-notes').addEventListener('click', function() {
        notesVisible = !notesVisible;
        document.querySelectorAll('.speaker-notes').forEach(function(n) {
          n.classList.toggle('visible', notesVisible);
        });
        this.textContent = notesVisible ? 'Hide Notes' : 'Notes';
      });

      document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'n') {
          e.preventDefault();
          if (current < total - 1) show(current + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace' || e.key === 'p') {
          e.preventDefault();
          if (current > 0) show(current - 1);
        } else if (e.key === 'Home') { e.preventDefault(); show(0); }
        else if (e.key === 'End') { e.preventDefault(); show(total - 1); }
        else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); }
      });

      // Init: show first slide
      show(0);
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
