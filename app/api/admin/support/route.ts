import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;

  const tickets = await prisma.supportTicket.findMany({
    include: { hr: { select: { name: true, email: true } }, company: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(tickets);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await parseBody<{ id?: string; status?: string; adminNotes?: string }>(request);
  if (body instanceof NextResponse) return body;

  const { id, status, adminNotes } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { status: status || undefined, adminNotes: adminNotes || undefined },
  });

  return NextResponse.json(ticket);
}
