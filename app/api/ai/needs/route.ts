import { NextRequest, NextResponse } from "next/server";
import { parseBody } from "@/lib/api-utils";
import { analyzeTrainingNeeds } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;
  
  const { responses } = body;
  if (!responses || !Array.isArray(responses)) return NextResponse.json({ error: "responses array required" }, { status: 400 });

  const result = await analyzeTrainingNeeds(responses);
  return NextResponse.json(result);
}
