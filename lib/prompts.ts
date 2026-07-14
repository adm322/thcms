/**
 * Prompt builders for MiniMax-powered Learning Studio features.
 * All return { system, user } — designed for minimaxChat(prompt, system).
 * AI is instructed to respond ONLY with valid JSON, no markdown fences.
 */

const JSON_ONLY_SYSTEM =
  "You are a helpful AI assistant. " +
  "Respond ONLY with valid JSON matching the schema described. " +
  "Do not wrap your answer in markdown code fences, backticks, or any formatting. " +
  "Output raw JSON only.";

// ─── Slide generation (structured JSON for React-based SlideViewer) ───

export interface BuildSlidePromptOptions {
  text: string;
  slideCount?: number;
  sourceImages?: Array<{ index: number; description: string }>;
}

export interface SlidePrompt {
  system: string;
  user: string;
}

const SLIDE_SCHEMA_DOCS = `Return a JSON array of slide objects. Each slide object:
{
  "title": "Slide headline (specific, data-driven)",
  "bulletPoints": ["Complete statement with data/example", "Second point"],
  "infographic": {                  // optional — null if not needed
    "type": "stat|quote|list|comparison|process",
    "title": "Optional infographic heading",
    "data": { /* type-specific fields (see below) */ }
  },
  "speakerNotes": "Additional insight or question for the trainer"
}

INFORAPHIC DATA SCHEMAS (use exactly one per slide, vary types across deck):

• stat — big number with label:
  { "value": "88%", "label": "Employees report higher satisfaction after coaching" }

• quote — pull-quote with attribution:
  { "quote": "The GROW model transforms reactive managers into proactive coaches", "author": "John Whitmore" }

• list — numbered cards (2-6 items):
  { "items": ["Set clear goals", "Reality-check current state", "Explore options", "Commit to action"] }

• comparison — two-column side-by-side:
  { "leftLabel": "Autocratic", "leftValue": "Fast decisions, low buy-in", "leftSub": "67% report disengagement",
    "rightLabel": "Democratic", "rightValue": "Slower process, high ownership", "rightSub": "85% adoption rate" }

• process — horizontal step flow (2-5 steps):
  { "steps": ["Goal", "Reality", "Options", "Will"] }

DESIGN RULES:
- Vary infographic types across slides — never repeat the same type more than 2 slides in a row.
- At least 3-4 slides should have an infographic. Others can be bullet-only.
- No slide should have more than 6 bulletPoints.
- speakerNotes is optional but recommended for 70%+ of slides.

First slide: title-only (bulletPoints: [], no infographic).
Last slide: summary (title: "Key Takeaways", bulletPoints: 3-5 takeaways, no infographic).
1-2 section-divider slides (bulletPoints: [] with 1-2 brief contextual bullets).`;

export function buildSlidePrompt(
  textOrOpts: string | BuildSlidePromptOptions,
  slideCountMaybe = 8
): SlidePrompt {
  const opts: BuildSlidePromptOptions =
    typeof textOrOpts === "string"
      ? { text: textOrOpts, slideCount: slideCountMaybe }
      : textOrOpts;
  const { text, sourceImages } = opts;
  const slideCount = opts.slideCount ?? 8;

  const imageSection = sourceImages && sourceImages.length > 0
    ? `\n\nThe original document contains ${sourceImages.length} images. Reference their descriptions to inform slide content: ${sourceImages.map((img) => `[Image ${img.index}]: ${img.description}`).join(" | ")}\n`
    : "";

  return {
    system:
      JSON_ONLY_SYSTEM +
      " You are an expert presentation designer for the Malaysian corporate market. " +
      "Return structured slide data (not HTML). Each slide has a title, bulletPoints array, optional infographic, and optional speakerNotes. " +
      "Vary infographic types across the deck. Be specific to the source content with real data points and examples. " +
      "Titles must be specific and action-oriented. Bullet points must be complete statements with context, not fragments.",
    user:
      `Generate a ${slideCount}-slide training deck from the following content.\n\n` +
      `${SLIDE_SCHEMA_DOCS}\n\n` +
      `WRITING QUALITY:\n` +
      `- Every slide must cite a SPECIFIC data point, statistic, or named example from the source text.\n` +
      `- Bullet points must be complete, specific statements with actionable detail and context.\n` +
      `- Numbers should have context: "RM 4.8M (enough to hire 80 new engineers)" not just "RM 4.8M".\n` +
      `- Titles must be specific: "The GROW Model in Practice" not just "Coaching".\n` +
      `- speakerNotes must contain an additional insight, discussion question, or real-world example.\n` +
      imageSection +
      `\n\nSOURCE TEXT:\n${text}\n\n` +
      `Return ONLY a JSON array matching the schema above. No markdown fences.`,
  };
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
