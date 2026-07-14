import { NextResponse } from "next/server";
import { enhanceDescription } from "@/lib/ai";
import { withAuth } from "@/lib/auth-guards";
import { EnhanceDescriptionSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export const POST = withAuth(
  async ({ session, request }) => {
    if (!rateLimit(`ai:enhance:${session.id}`, 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = EnhanceDescriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { title, bulletPoints } = parsed.data;
    const description = await enhanceDescription(title, bulletPoints ?? []);
    return NextResponse.json({ description });
  }
);
