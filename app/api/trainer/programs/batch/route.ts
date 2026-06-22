import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    title,
    description,
    category,
    durationHours,
    maxParticipants,
    pricePerPax,
    locationType,
    syllabus,
    modules,
  } = body;

  if (!title || !category) {
    return NextResponse.json({ error: "title and category are required" }, { status: 400 });
  }

  // Create program + modules in a transaction
  const program = await prisma.$transaction(async (tx) => {
    const prog = await tx.program.create({
      data: {
        trainerId: session.id!,
        title,
        description: description || "",
        category: category || "Other",
        durationHours: durationHours || 4,
        maxParticipants: maxParticipants || 20,
        pricePerPax: pricePerPax || 0,
        locationType: locationType || "ON_SITE",
        syllabus: syllabus || [],
        status: "DRAFT",
      },
    });

    if (modules && Array.isArray(modules) && modules.length > 0) {
      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        await tx.module.create({
          data: {
            programId: prog.id,
            title: mod.title,
            description: mod.description || "",
            durationMins: mod.durationMins || 60,
            orderIndex: mod.orderIndex ?? i,
          },
        });
      }
    }

    return prog;
  });

  // Fetch with modules
  const full = await prisma.program.findUnique({
    where: { id: program.id },
    include: { modules: { orderBy: { orderIndex: "asc" } } },
  });

  return NextResponse.json(full, { status: 201 });
}