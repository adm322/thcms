import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // Clone modules
  for (const mod of program.modules) {
    await prisma.module.create({
      data: {
        programId: clone.id,
        title: mod.title,
        description: mod.description,
        orderIndex: mod.orderIndex,
        durationMins: mod.durationMins,
      },
    });
  }

  return NextResponse.json(clone, { status: 201 });
}
