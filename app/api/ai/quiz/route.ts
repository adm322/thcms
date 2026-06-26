import { NextRequest, NextResponse } from "next/server";
import { generateQuizQuestions } from "@/lib/ai";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  
  const bodyRecord = body as Record<string, unknown>;
  const topic = bodyRecord?.topic as string | undefined;
  const count = bodyRecord?.count as number | undefined;

  if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });

  const questions = await generateQuizQuestions(topic, count || 5);
  return NextResponse.json({ questions });
}
