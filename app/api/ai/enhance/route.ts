import { NextRequest, NextResponse } from "next/server";
import { enhanceDescription } from "@/lib/ai";

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  
  const { title, bulletPoints } = body;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const description = await enhanceDescription(title, bulletPoints || []);
  return NextResponse.json({ description });
}
