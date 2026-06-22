import { NextRequest, NextResponse } from "next/server";
import { analyzeTrainingNeeds } from "@/lib/ai";

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  
  const { responses } = body;
  if (!responses || !Array.isArray(responses)) return NextResponse.json({ error: "responses array required" }, { status: 400 });

  const result = await analyzeTrainingNeeds(responses);
  return NextResponse.json(result);
}
