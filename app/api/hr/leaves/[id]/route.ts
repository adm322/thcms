import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const { status } = body as Record<string, string>;
  if (!status || !["APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
    return NextResponse.json({ error: "Valid status required: APPROVED, REJECTED, CANCELLED" }, { status: 400 });
  }

  const leave = await prisma.leave.update({
    where: { id },
    data: { status, approvedById: session.id },
    include: { employee: { select: { name: true } } },
  });

  return NextResponse.json(leave);
}
