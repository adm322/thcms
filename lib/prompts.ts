/**
 * Prompt builders for MiniMax-powered Learning Studio features.
 * All return { system, user } — designed for minimaxChat(prompt, system).
 * MiniMax is instructed to respond ONLY with valid JSON, no markdown fences.
 */

const JSON_ONLY_SYSTEM =
  "You are a helpful AI assistant. " +
  "Respond ONLY with valid JSON matching the schema described. " +
  "Do not wrap your answer in markdown code fences, backticks, or any formatting. " +
  "Output raw JSON only.";

// ─── Slide generation (HTML-based, like a 16:9 magazine spread) ───

export interface BuildSlidePromptOptions {
  text: string;
  slideCount?: number;
  sourceImages?: Array<{ index: number; description: string }>;
}

export interface SlidePrompt {
  system: string;
  user: string;
}

const SLIDE_HTML_DOCS = `Each slide is a self-contained HTML string.
Return a JSON array of slide objects:
[
  { "html": "<section class='slide' style='...'>...</section>",
    "speakerNotes": "..." }
]

RULES for each slide's HTML:
- Wrap each slide in <section class='slide'>.
- Design for a 16:9 layout (~1280x720 mental model). Use container query units (cqw) for ALL sizes:
    h1 ~ 5-6cqw, h2 ~ 3-3.5cqw, p/li ~ 1.8-2.2cqw, caption ~ 1.2cqw.
    The renderer will set container-type: size so cqw units scale to the slide frame.
- 48-64px outer padding. Use the existing brand color (indigo: #6366f1) and warm gray (#475569 for body).
- Use semantic HTML: <h1> slide title, <h2> section, <p>/<ul>/<ol> body, <table> data, <blockquote> quotes, <figure> images.
- Use inline styles only (style="..." attribute). No external CSS. No <style> tags inside the slide HTML.
- Each slide is one self-contained <section>. No overflow. Keep content compact.
- Vary layouts — DO NOT make every slide a bullet list. Alternate between:
  - Numbered key points with brief explanations
  - Two-column (text + image, or compare side-by-side)
  - Big-stat hero with supporting text
  - Data table with caption
  - Pull-quote with attribution
  - Mixed grid (icon + label + short description)
- For images use: <figure><img src='https://images.unsplash.com/photo-...' alt='...' style='width:100%;height:100%;object-fit:cover;border-radius:12px' /></figure>.
- NEVER use <script>, <iframe>, <style>, on* event handlers, javascript: URLs, or data: URLs.
- Do NOT exceed 5-7 distinct elements per slide. Less is more.

Content quality rules:
- Every slide must be specific to the source content, not generic. No placeholder language.
- Bullets should be COMPLETE statements with data or examples, not fragments.
- Numbers should have context or comparison.
- Vary sentence length for rhythm.

First slide: cover (h1 title, p subtitle, presenter/date).
Last slide: summary (h1 key takeaways, ul list, closing).
1-2 section dividers (h2 + h3 sub-content) between.

Generate exactly slideCount slides. The renderer mounts each <section> directly via dangerouslySetInnerHTML. NO overflows will be tolerated.`;

const imageSection = (sourceImages?: Array<{ index: number; description: string }>) =>
  sourceImages && sourceImages.length > 0
    ? `\n\nSOURCE IMAGES (${sourceImages.length} from the original document):
${sourceImages.map((img) => `  [Image ${img.index}]: ${img.description}`).join("\n")}
Use these as a reference. The renderer can substitute the actual data: URL when you reference an image by index in the <img> tag via a marker class like data-img-ref="<index>".\n`
    : "";

export function buildSlidePrompt(
  textOrOpts: string | BuildSlidePromptOptions,
  slideCountMaybe = 8
): SlidePrompt {
  // Support both legacy positional args and a single options object
  const opts: BuildSlidePromptOptions =
    typeof textOrOpts === "string"
      ? { text: textOrOpts, slideCount: slideCountMaybe }
      : textOrOpts;
  const { text, sourceImages } = opts;
  const slideCount = opts.slideCount ?? 8;

  return {
    system:
      JSON_ONLY_SYSTEM +
      " You are an expert presentation designer for the Malaysian corporate market. " +
      "Each slide you return is a self-contained HTML section that the renderer mounts directly. " +
      "Prioritize visual quality and content density — each slide must look like a polished 16:9 magazine spread, not a plain bullet list. " +
      "Vary the layout across slides (use a mix of text, data, images, and tables — never all bullets). " +
      "Always include a `speakerNotes` field with an additional insight, question to ask the class, or real-world example the trainer can share.",
    user:
      `Generate a ${slideCount}-slide training deck from the following content.\n\n` +
      `Return a JSON array of slide objects, each with an 'html' field and an optional 'speakerNotes' field.\n\n` +
      `Available shapes and content quality rules:\n${SLIDE_HTML_DOCS}\n\n` +
      `WRITING QUALITY:\n` +
      `- Every slide must cite a SPECIFIC data point, statistic, or named example from the source text.\n` +
      `- Bullets should be complete, specific statements with actionable detail.\n` +
      `- Numbers should have context: "RM 4.8M (enough to hire 80 new engineers)" not just "RM 4.8M".\n` +
      `- Use active voice. Use varied sentence length. Mix short and long.\n` +
      `- Titles must be specific: "The GROW Model in Practice" not "Coaching".\n` +
      `- speakerNotes must contain an additional insight, question, or example.\n\n` +
      `SOURCE TEXT:\n${text}\n\n` +
      imageSection(sourceImages) +
      `\n\nSlide array shape:\n` +
      `[\n` +
      `  { "html": "<section class='slide' style='padding:3cqw; font-family:Inter,system-ui,sans-serif; color:#1e293b;'><h1 style='font-size:5.5cqw;font-weight:800;line-height:1.1;margin:0 0 0.5em;color:#6366f1;'>Specific Title</h1><p style='font-size:2.2cqw;line-height:1.4;color:#475569;'>Subtitle or context here.</p></section>",\n` +
      `    "speakerNotes": "Ask the class: ..." },\n` +
      `  { "html": "<section class='slide' style='padding:3cqw;'><h1 style='font-size:4.5cqw;font-weight:800;margin:0 0 0.5em;'>Bullets slide title</h1><ol style='font-size:2.1cqw;line-height:1.4;padding-left:3cqw;margin:0;'><li style='margin:0.6em 0;'>First specific point with data.</li><li style='margin:0.6em 0;'>Second point with example.</li><li style='margin:0.6em 0;'>Third point.</li></ol></section>",\n` +
      `    "speakerNotes": "..." },\n` +
      `  { "html": "<section class='slide' style='padding:3cqw;'><h1 style='font-size:4.5cqw;font-weight:800;margin:0 0 0.5em;'>Quote slide</h1><blockquote style='font-size:3cqw;font-style:italic;color:#475569;border-left:6px solid #6366f1;padding:1cqw 0 1cqw 2cqw;margin:1cqw 0;'>The actual insight here.</blockquote><p style='font-size:1.6cqw;color:#64748b;text-align:right;margin:1cqw 2cqw 0;'>— Attribution</p></section>" },\n` +
      `  { "html": "<section class='slide' style='padding:3cqw;'><h1 style='font-size:4.5cqw;font-weight:800;margin:0 0 0.5em;'>Compare slide</h1><div style='display:grid;grid-template-columns:1fr 1fr;gap:2cqw;'><div style='background:#fef2f2;border:2px solid #fca5a5;padding:2cqw;border-radius:16px;'><h2 style='font-size:2.2cqw;color:#dc2626;margin:0 0 0.5em;'>Before</h2><ul style='font-size:1.7cqw;padding-left:1.5cqw;color:#7f1d1d;line-height:1.4;'><li>Reactive handling</li><li>No framework</li><li>67% report gaps</li></ul></div><div style='background:#f0fdf4;border:2px solid #86efac;padding:2cqw;border-radius:16px;'><h2 style='font-size:2.2cqw;color:#16a34a;margin:0 0 0.5em;'>After</h2><ul style='font-size:1.7cqw;padding-left:1.5cqw;color:#14532d;line-height:1.4;'><li>Proactive system</li><li>Structured approach</li><li>85% adoption</li></ul></div></div></section>" }\n` +
      `]`,
  };
}

/**
 * Sanitize AI-generated slide HTML. Defenses:
 * - <script> tags (with all content)
 * - on* event handlers (onclick, onload, onerror, etc.)
 * - javascript: and data:text/html URLs in href/src
 * Keeps the actual semantic HTML, just sanitizes the attack surface.
 */
export function sanitizeSlideHtml(html: string): string {
  return html
    // Remove <script>...</script> blocks (case-insensitive, multiline)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove on* event handler attributes (onclick, onload, onerror, onmouseover, etc.)
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    // Replace dangerous URL schemes
    .replace(/javascript:/gi, "")
    .replace(/data\s*:\s*text\/html/gi, "");
}

/**
 * Pick a slide count based on source text length. Roughly 1 slide per
 * 500-700 chars of content, clamped to 6-20.
 */
export function slidesForContentLength(textLength: number): number {
  if (textLength < 1500) return 6;
  if (textLength < 3000) return 8;
  if (textLength < 5000) return 10;
  if (textLength < 8000) return 13;
  if (textLength < 12000) return 16;
  return 20;
}

// ─── Quiz Generation ──────────────────────────────────────────────────────

export function buildQuizPrompt(
  sourceText: string,
  questionCount: number = 5,
): { system: string; user: string } {
  return {
    system:
      JSON_ONLY_SYSTEM +
      " You are an expert quiz designer for corporate training. " +
      "Create multiple-choice quiz questions that test understanding of the provided training material.",
    user:
      `Generate ${questionCount} multiple-choice quiz questions from the following training content.\n\n` +
      `Return a JSON array of question objects:\n` +
      `[\n` +
      `  {\n` +
      `    "text": "Question text here",\n` +
      `    "options": ["A) Option one", "B) Option two", "C) Option three", "D) Option four"],\n` +
      `    "correctIndex": 0,\n` +
      `    "explanation": "Why this is correct"\n` +
      `  }\n` +
      `]\n\n` +
      `RULES:\n` +
      `- Each question must have exactly 4 options\n` +
      `- correctIndex is 0-based (0 = A, 1 = B, etc.)\n` +
      `- Questions should test comprehension, not just recall\n` +
      `- Vary the difficulty — mix easy, medium, and hard questions\n` +
      `- Include the correct answer explanation\n\n` +
      `SOURCE TEXT:\n${sourceText.slice(0, 6000)}`,
  };
}

// ─── RAG Chat ────────────────────────────────────────────────────────────

export interface ChatPrompt {
  system: string;
  user: string;
}

export function buildChatPrompt(
  question: string,
  contextChunks: string[],
  programTitle?: string,
): ChatPrompt {
  const context = contextChunks.map((c, i) => `[CHUNK ${i + 1}]:\n${c}`).join("\n\n");
  return {
    system:
      JSON_ONLY_SYSTEM +
      " You are a knowledgeable training assistant. Answer questions about the provided training materials accurately and concisely. " +
      "Base your answer ONLY on the provided context chunks. If the context doesn't contain the answer, say so honestly.",
    user:
      `Program${programTitle ? `: ${programTitle}` : ""}\n\n` +
      `CONTEXT:\n${context}\n\n` +
      `QUESTION: ${question}\n\n` +
      `Provide a helpful answer based on the context above.`,
  };
}
