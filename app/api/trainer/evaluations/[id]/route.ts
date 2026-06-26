import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: { booking: { select: { program: { select: { trainerId: true } } } } },
  });

  if (!evaluation || evaluation.booking.program.trainerId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(evaluation);
}
