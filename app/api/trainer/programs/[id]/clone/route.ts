import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const program = await prisma.program.findUnique({
    where: { id },
    include: { modules: true },
  });
  if (!program || program.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const clone = await prisma.program.create({
    data: {
      trainerId: session.id,
      title: `${program.title} (Copy)`,
      description: program.description,
      category: program.category,
      durationHours: program.durationHours,
      maxParticipants: program.maxParticipants,
      pricePerPax: program.pricePerPax,
      locationType: program.locationType,
      syllabus: program.syllabus,
      status: "DRAFT",
    },
  });

  // Clone modules using createMany for better performance
  if (program.modules && program.modules.length > 0) {
    await prisma.module.createMany({
      data: program.modules.map((mod) => ({
        programId: clone.id,
        title: mod.title,
        description: mod.description,
        orderIndex: mod.orderIndex,
        durationMins: mod.durationMins,
      })),
    });
  }

  return NextResponse.json(clone, { status: 201 });
}
