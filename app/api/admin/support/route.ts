import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tickets = await prisma.supportTicket.findMany({
    include: { hr: { select: { name: true, email: true } }, company: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(tickets);
}

export async function PATCH(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { id, status, adminNotes } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { status: status || undefined, adminNotes: adminNotes || undefined },
  });

  return NextResponse.json(ticket);
}
