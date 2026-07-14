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
  let body: { attendanceStatus?: string };
  try { body = await _req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { attendanceStatus } = body;
  if (!attendanceStatus) return NextResponse.json({ error: "attendanceStatus required" }, { status: 400 });

  try {
    await prisma.participant.update({ where: { id: participantId }, data: { attendanceStatus } });
  } catch {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
