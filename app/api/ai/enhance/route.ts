import { NextRequest, NextResponse } from "next/server";
import { parseBody } from "@/lib/api-utils";
import { enhanceDescription } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;
  
  const { title, bulletPoints } = body as { title: string; bulletPoints?: string[] };
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const description = await enhanceDescription(title, bulletPoints || []);
  return NextResponse.json({ description });
}
