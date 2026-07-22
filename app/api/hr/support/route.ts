import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const tickets = await prisma.supportTicket.findMany({
    where: { companyId: session.companyId },
    orderBy: { updatedAt: "desc" },
      take: 100,
      skip: 0
});

  return NextResponse.json(tickets);
}

export async function POST(request: NextRequest) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const { subject, description, category, priority } = body as Record<string, string>;
  if (!subject) return NextResponse.json({ error: "Subject is required" }, { status: 400 });

  const ticket = await prisma.supportTicket.create({
    data: {
      hrId: session.id,
      companyId: session.companyId,
      subject,
      description: description || "",
      category: category || "GENERAL",
      priority: priority || "MEDIUM",
      status: "OPEN",
    },
  });

  return NextResponse.json(ticket, { status: 201 });
}
