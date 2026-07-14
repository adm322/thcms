import { NextResponse } from "next/server";
import { analyzeTrainingNeeds } from "@/lib/ai";
import { withAuth } from "@/lib/auth-guards";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const NeedsSchema = z.object({
  responses: z.array(z.unknown()).min(1).max(5000),
});

export const POST = withAuth(
  async ({ session, request }) => {
    if (!rateLimit(`ai:needs:${session.id}`, 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = NeedsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const result = await analyzeTrainingNeeds(
      parsed.data.responses as { question: string; answer: string }[]
    );
    return NextResponse.json(result);
  }
);
