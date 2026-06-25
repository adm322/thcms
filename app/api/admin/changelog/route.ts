import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const entries = await prisma.changelog.findMany({
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { version, title, type, details } = body;
  if (!version || !title) return NextResponse.json({ error: "version and title required" }, { status: 400 });

  const entry = await prisma.changelog.create({
    data: { version, title, type: type || "FEATURE", details: details || "" },
  });

  return NextResponse.json(entry, { status: 201 });
}
