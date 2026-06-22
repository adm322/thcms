import { NextRequest, NextResponse } from "next/server";
import { generateQuizQuestions } from "@/lib/ai";

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  
  const { topic, count } = body;
  if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });

  const questions = await generateQuizQuestions(topic, count || 5);
  return NextResponse.json({ questions });
}
