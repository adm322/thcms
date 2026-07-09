/**
 * AI client
 * - Chat completions: DeepSeek (OpenAI-compatible)
 * - Embeddings: Nomic Atlas (nomic-embed-text-v1.5)
 * - SVG generation: DeepSeek chat with structured output
 *
 * Configuration is read from env at call time so it can be overridden
 * per-deployment without editing source.
 *   MINIMAX_API_KEY    — DeepSeek API key (required for chat/SVG)
 *   MINIMAX_BASE_URL   — defaults to https://api.deepseek.com
 *   MINIMAX_CHAT_MODEL — defaults to "deepseek-chat"
 *   MINIMAX_EMBED_MODEL — currently unused (we hardcode the Nomic model)
 *   NOMIC_API_KEY      — Nomic Atlas key (required for embeddings)
 */

const DEEPSEEK_BASE_DEFAULT = "https://api.deepseek.com";
const DEEPSEEK_MODEL_DEFAULT = "deepseek-chat";
const NOMIC_BASE = "https://api-atlas.nomic.ai/v1/embedding/text";
const NOMIC_MODEL = "nomic-embed-text-v1.5";

function getDeepSeekBase(): string {
  return process.env.MINIMAX_BASE_URL || DEEPSEEK_BASE_DEFAULT;
}
function getDeepSeekModel(): string {
  return process.env.MINIMAX_CHAT_MODEL || DEEPSEEK_MODEL_DEFAULT;
}

function getDeepSeekKey(): string {
  const key = process.env.MINIMAX_API_KEY;
  if (!key) throw new Error("MINIMAX_API_KEY is not set");
  return key;
}

function getNomicKey(): string {
  const key = process.env.NOMIC_API_KEY;
  if (!key) throw new Error("NOMIC_API_KEY is not set");
  return key;
}

// ─── Chat (DeepSeek) ────────────────────────────────────────────────

export async function minimaxChat(
  prompt: string,
  system?: string
): Promise<string | null> {
  const apiKey = getDeepSeekKey();

  const messages: { role: "system" | "user"; content: string }[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  try {
    const res = await fetch(`${getDeepSeekBase()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: getDeepSeekModel(), messages }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`DeepSeek chat error ${res.status}:`, err);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (error) {
    console.error("DeepSeek chat error:", error);
    return null;
  }
}

// ─── Embedding (Nomic) ──────────────────────────────────────────────

export async function minimaxEmbed(text: string): Promise<number[] | null> {
  const apiKey = getNomicKey();

  try {
    const res = await fetch(NOMIC_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: NOMIC_MODEL,
        task_type: "search_document",
        texts: [text],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Nomic embed error ${res.status}:`, err);
      return null;
    }

    const data = await res.json();
    // Response: { embeddings: [[...float values...]] }
    const embeddings: number[][] = data.embeddings ?? [];
    if (Array.isArray(embeddings) && Array.isArray(embeddings[0])) {
      return embeddings[0];
    }
    return null;
  } catch (error) {
    console.error("Nomic embed error:", error);
    return null;
  }
}

// ─── SVG Generation (DeepSeek chat) ─────────────────────────────────

export async function minimaxSVG(prompt: string): Promise<string | null> {
  const apiKey = getDeepSeekKey();

  const systemPrompt =
    `You are an SVG generator. Output ONLY a valid SVG XML string, no markdown, no explanation, no code fences. ` +
    `The SVG should be clean, minimal, and suitable for embedding in a presentation slide. ` +
    `Use viewBox, appropriate colors, and readable text.`;

  try {
    const res = await fetch(`${getDeepSeekBase()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getDeepSeekModel(),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`DeepSeek SVG error ${res.status}:`, err);
      return null;
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? "";
    return content.replace(/^```svg\s*/i, "").replace(/```$/i, "").trim();
  } catch (error) {
    console.error("DeepSeek SVG error:", error);
    return null;
  }
}
