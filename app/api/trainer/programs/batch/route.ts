import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

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
  } = body as {
    title: string; description?: string; category: string; durationHours?: number;
    maxParticipants?: number; pricePerPax?: number; locationType?: string;
    syllabus?: string; modules?: { title: string; description?: string; durationMins?: number; orderIndex?: number }[];
  };

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
        syllabus: syllabus || "[]",
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