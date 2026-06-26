import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;

  const { participantId } = await params;
  const body = await _req.json().catch(() => ({}));
  const { attendanceStatus } = body;

  await prisma.participant.update({ where: { id: participantId }, data: { attendanceStatus } });
  return NextResponse.json({ success: true });
}
