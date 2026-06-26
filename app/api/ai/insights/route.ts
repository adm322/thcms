import { NextRequest, NextResponse } from "next/server";
import { parseBody } from "@/lib/api-utils";
import { analyzeEvaluationComments } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;
  
  const { comments } = body;
  if (!comments || !Array.isArray(comments)) return NextResponse.json({ error: "comments array required" }, { status: 400 });

  const insights = await analyzeEvaluationComments(comments);
  return NextResponse.json(insights);
}
