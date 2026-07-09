/**
 * Extract a `ProgramDraft` from raw training-document text.
 *
 * Single AI call. Returns fields matching the Prisma `Program` model so the
 * trainer UI can drop the result straight into the create form.
 *
 * Requires an OPENAI_API_KEY in the environment. If none is set, the
 * function throws `AIKeyMissingError` so the UI can surface a clear
 * "Configure OPENAI_API_KEY" message instead of silently failing.
 */

export interface ProgramModule {
  title: string;
  description: string;
  durationMins: number;
}

export interface ProgramItineraryItem {
  type: "REGISTRATION" | "MEAL" | "MODULE" | "BREAK" | "CLOSING";
  title: string;
  startTime: string;
  endTime: string;
}

export interface ProgramDraft {
  title: string;
  description: string;
  category: string;
  durationHours: number;
  maxParticipants: number;
  pricePerPax: number;
  locationType: "onsite" | "online" | "hybrid";
  /** 3-8 module titles. Each module's description is the syllabus item for that topic. */
  modules: ProgramModule[];
  /** Suggested day schedule with time slots (optional — generated from content). */
  itinerary: ProgramItineraryItem[];
  /** AI-generated training proposal — executive summary, pricing, timeline, trainer info. */
  proposalContent: string;
}

export const CATEGORIES = [
  "Leadership",
  "Technical",
  "Soft Skills",
  "Compliance",
  "Team Building",
  "HR Operations",
  "Other",
] as const;

export class AIKeyMissingError extends Error {
  constructor() {
    super(
      "No AI API key configured. Set MINIMAX_API_KEY (DeepSeek) or OPENAI_API_KEY in your .env " +
        "to enable auto-extract. Trainers can still fill in the form manually."
    );
    this.name = "AIKeyMissingError";
  }
}

const EXTRACTION_PROMPT = `You are an expert training-program designer for the Malaysian corporate market.

Given the following training-document text, extract a complete program draft as a JSON object with EXACTLY these fields:
{
  "title": string,                     // Catchy, professional, 3-8 words
  "description": string,               // 2-3 paragraphs, professional tone, target audience: Malaysian HR/managers
  "category": one of: ${CATEGORIES.map((c) => JSON.stringify(c)).join(", ")},
  "durationHours": number,             // total program duration, 1-40
  "maxParticipants": number,           // 5-50
  "pricePerPax": number,               // in MYR, 200-5000
  "locationType": one of: "onsite", "online", "hybrid",
  "modules": { title: string, description: string, durationMins: number }[3-6],
  "itinerary": { type: "REGISTRATION"|"MEAL"|"MODULE"|"BREAK"|"CLOSING", title: string, startTime: string, endTime: string }[2-10],
  "proposalContent": string            // Full training proposal with: executive summary, pricing per module, deliverables timeline, trainer bio, terms. Professional tone. 3-5 paragraphs.
}

Guidelines:
- "modules.description" is the topic/syllabus item for that module (e.g. "Learn Kotter's 8-step change model").
- "itinerary" is a day schedule: start with "REGISTRATION" (09:00), then a series of "MODULE" slots (each 90-240 min), with "BREAK" and "MEAL" interspersed. Use realistic times. If you can infer content, set the title appropriately.
- "proposalContent" must be a complete professional training proposal. Include a pricing table (RM per module or per pax), a deliverables list, a timeline table, trainer credentials, and terms. Write it as formatted text with line breaks.
- Title should NOT include quotes or prefixes like "Training:" — just the program name.
- Description should be 2-3 paragraphs, professional, no marketing fluff.
- If the document is in another language, translate to English.
- If the document is too short or unclear, make reasonable best-guess values.
- pricePerPax default: 700 (mid-range for Malaysian corporate training).
- durationHours default: 8 if not specified.
- maxParticipants default: 20.

Respond ONLY with the JSON object. No markdown, no code fences, no explanation.`;

interface AIResponseShape {
  title: string;
  description: string;
  category: string;
  durationHours: number;
  maxParticipants: number;
  pricePerPax: number;
  locationType: "onsite" | "online" | "hybrid";
  modules: { title: string; description?: string; durationMins: number }[];
  itinerary?: { type: string; title: string; startTime: string; endTime: string }[];
  proposalContent?: string;
}

function isAIResponseShape(v: unknown): v is AIResponseShape {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.title === "string" &&
    typeof o.description === "string" &&
    typeof o.category === "string" &&
    typeof o.durationHours === "number" &&
    typeof o.maxParticipants === "number" &&
    typeof o.pricePerPax === "number" &&
    (o.locationType === "onsite" ||
      o.locationType === "online" ||
      o.locationType === "hybrid") &&
    Array.isArray(o.modules)
  );
}

function clampInt(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function clampString(s: string, max: number): string {
  return (s ?? "").trim().slice(0, max);
}

function clampStringArray(arr: unknown, min: number, max: number, itemMax: number): string[] {
  if (!Array.isArray(arr)) return [];
  const cleaned = arr
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim().slice(0, itemMax));
  if (cleaned.length < min) return cleaned;
  return cleaned.slice(0, max);
}

/**
 * Validate and normalize the raw AI response into a `ProgramDraft`.
 * Defensive — never trusts the AI to return well-formed data.
 */
export function normalizeDraft(raw: unknown): ProgramDraft {
  if (!isAIResponseShape(raw)) {
    throw new Error("AI returned an invalid program draft (schema mismatch)");
  }

  const category = CATEGORIES.includes(raw.category as never)
    ? raw.category
    : "Other";

  return {
    title: clampString(raw.title, 200) || "Untitled Program",
    description: clampString(raw.description, 2000) || "",
    category,
    durationHours: clampInt(raw.durationHours, 1, 40, 8),
    maxParticipants: clampInt(raw.maxParticipants, 1, 100, 20),
    pricePerPax: clampInt(raw.pricePerPax, 0, 100000, 700),
    locationType: raw.locationType,
    modules: raw.modules
      .filter((m) => m && typeof m.title === "string" && m.title.trim().length > 0)
      .slice(0, 8)
      .map((m) => ({
        title: clampString(m.title, 200),
        description: typeof m.description === "string" ? clampString(m.description, 500) : "",
        durationMins: clampInt(m.durationMins, 15, 480, 60),
      })),
    itinerary: Array.isArray(raw.itinerary)
      ? raw.itinerary
          .filter((it) => it && typeof it.title === "string" && typeof it.startTime === "string")
          .slice(0, 10)
          .map((it) => ({
            type: (["REGISTRATION", "MEAL", "MODULE", "BREAK", "CLOSING"].includes(it.type)
              ? it.type
              : "MODULE") as ProgramItineraryItem["type"],
            title: clampString(it.title, 200),
            startTime: it.startTime.slice(0, 5),
            endTime: typeof it.endTime === "string" ? it.endTime.slice(0, 5) : "17:00",
          }))
      : [],
    proposalContent: typeof raw.proposalContent === "string"
      ? raw.proposalContent.slice(0, 10000)
      : "",
  };
}

export async function extractProgramFromText(text: string): Promise<ProgramDraft> {
  if (!text || text.trim().length < 20) {
    throw new Error(
      "Could not extract enough text from the uploaded file. " +
        "Try a different document or fill in the form manually."
    );
  }

  if (!process.env.MINIMAX_API_KEY && !process.env.OPENAI_API_KEY) {
    throw new AIKeyMissingError();
  }

  // Lazy import to avoid loading the AI client at module top-level
  // (testability + faster cold start)
  // Prefer DeepSeek via lib/minimax.ts (which is the configured production
  // provider in this project). Fall back to OpenAI if a key is set.
  let response: string | null = null;
  if (process.env.MINIMAX_API_KEY) {
    const { minimaxChat } = await import("./minimax");
    response = await minimaxChat(EXTRACTION_PROMPT + "\n\n---\n\nDocument text:\n" + text.slice(0, 12000));
  } else if (process.env.OPENAI_API_KEY) {
    const ai = await import("./ai");
    response = await ai.callAI(EXTRACTION_PROMPT + "\n\n---\n\nDocument text:\n" + text.slice(0, 12000));
  }
  if (!response) {
    throw new AIKeyMissingError();
  }

  // Extract the first JSON object from the response
  const match = response.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("AI did not return a JSON object");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new Error("AI returned malformed JSON");
  }

  return normalizeDraft(parsed);
}
