import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { companyId: session.companyId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(tickets);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { subject, description, category, priority } = body;
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
