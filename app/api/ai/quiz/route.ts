import { NextRequest, NextResponse } from "next/server";
import { parseBody } from "@/lib/api-utils";
import { generateQuizQuestions } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;
  
  const topic = body.topic as string | undefined;
  const count = body.count as number | undefined;

  if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });

  const questions = await generateQuizQuestions(topic, count || 5);
  return NextResponse.json({ questions });
}
