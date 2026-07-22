import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, parseBody } from "@/lib/api-utils";

export async function GET() {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;

  const entries = await prisma.changelog.findMany({
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
      skip: 0
});

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const { version, title, type, details } = body as Record<string, string>;
  if (!version || !title) return NextResponse.json({ error: "version and title required" }, { status: 400 });

  const entry = await prisma.changelog.create({
    data: { version, title, type: type || "FEATURE", details: details || "" },
  });

  return NextResponse.json(entry, { status: 201 });
}
