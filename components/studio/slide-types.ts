/**
 * Slide data model for the Learning Studio.
 *
 * From v3 onwards, slides are AI-generated HTML <section> blocks mounted
 * directly via dangerouslySetInnerHTML. The earlier discriminated-union
 * shape (title/section/bullets/metrics/...) is preserved as LegacySlide
 * for back-compat with any data still in the DB from before the migration.
 */

export type Density = "sparse" | "normal" | "dense";

/** New (v3+) shape: a single self-contained HTML string per slide. */
export interface HtmlSlide {
  type: "html";
  /** Self-contained <section class='slide'> HTML. Mounted via dangerouslySetInnerHTML. */
  html: string;
  speakerNotes?: string;
}

/**
 * v4+ shape: structured JSON returned by DeepSeek, rendered by SlideViewer
 * React components (not dangerouslySetInnerHTML). No `type` or `html` field.
 */
export interface StructuredSlide {
  title: string;
  bulletPoints: string[];
  infographic?: unknown; // Shape: { type: "stat"|"quote"|"list"|"comparison"|"process", title?: string, data?: Record<string, unknown> }
  speakerNotes?: string;
}

/** Legacy discriminated union — kept only for back-compat rendering. */
export interface TitleSlide {
  type: "title";
  title: string;
  subtitle?: string;
  presenter?: string;
  date?: string;
  imageUrl?: string;
}
export interface QuoteSlide {
  type: "quote";
  text: string;
  attribution?: string;
  imageUrl?: string;
}
export interface BulletsSlide {
  type: "bullets";
  title: string;
  bullets: string[];
  imageUrl?: string;
  imagePrompt?: string;
  density?: Density;
  speakerNotes?: string;
}
export interface MetricsSlide {
  type: "metrics";
  title: string;
  metrics: { value: string; label: string }[];
  caption?: string;
  imageUrl?: string;
  density?: Density;
  speakerNotes?: string;
}
export interface CompareSlide {
  type: "compare";
  title: string;
  leftHeading: string;
  leftPoints: string[];
  rightHeading: string;
  rightPoints: string[];
  imageUrl?: string;
  density?: Density;
  speakerNotes?: string;
}
export interface TableSlide {
  type: "table";
  title: string;
  headers: string[];
  rows: string[][];
  density?: Density;
  speakerNotes?: string;
}
export interface ChartSlide {
  type: "chart";
  title: string;
  chartType: "bar" | "line" | "pie" | "donut";
  data: { label: string; value: number }[];
  caption?: string;
  imageUrl?: string;
  density?: Density;
  speakerNotes?: string;
}
export interface SectionSlide {
  type: "section";
  sectionNumber: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
}
export interface SummarySlide {
  type: "summary";
  title: string;
  takeaways: string[];
  closingMessage?: string;
  imageUrl?: string;
  density?: Density;
}

export type LegacySlide =
  | TitleSlide
  | QuoteSlide
  | BulletsSlide
  | MetricsSlide
  | CompareSlide
  | TableSlide
  | ChartSlide
  | SectionSlide
  | SummarySlide;

export type Slide = HtmlSlide | LegacySlide | StructuredSlide;

export type SlideType = HtmlSlide["type"] | LegacySlide["type"];

/** Type guard: is the slide a new-style HTML slide? */
export function isHtmlSlide(s: Slide): s is HtmlSlide {
  return "type" in s && s.type === "html" && typeof (s as HtmlSlide).html === "string";
}

/** Type guard: is the slide a legacy discriminated shape? */
export function isLegacySlide(s: Slide): s is LegacySlide {
  return "type" in s && s.type !== "html";
}

/** Type guard: is the slide a new structured (v4) slide rendered by SlideViewer? */
export function isStructuredSlide(s: Slide): s is StructuredSlide {
  return !("type" in s) && "title" in s && "bulletPoints" in s;
}
