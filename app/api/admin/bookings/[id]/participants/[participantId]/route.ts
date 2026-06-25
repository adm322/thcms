import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { participantId } = await params;
  const body = await _req.json().catch(() => ({}));
  const { attendanceStatus } = body;

  await prisma.participant.update({ where: { id: participantId }, data: { attendanceStatus } });
  return NextResponse.json({ success: true });
}
