import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;
  const { id: programId } = await params;

  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program || program.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, description, orderIndex, durationMins } = await request.json();

  const mod = await prisma.module.create({
    data: { programId, title, description, orderIndex: orderIndex || 0, durationMins: durationMins || 60 },
  });

  return NextResponse.json(mod, { status: 201 });
}
