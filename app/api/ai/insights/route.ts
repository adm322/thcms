import { NextRequest, NextResponse } from "next/server";
import { analyzeEvaluationComments } from "@/lib/ai";

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  
  const { comments } = body;
  if (!comments || !Array.isArray(comments)) return NextResponse.json({ error: "comments array required" }, { status: 400 });

  const insights = await analyzeEvaluationComments(comments);
  return NextResponse.json(insights);
}
