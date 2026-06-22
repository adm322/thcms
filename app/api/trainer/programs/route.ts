import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const programs = await prisma.program.findMany({
    where: { trainerId: session.id },
    include: {
      _count: { select: { modules: true, bookings: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    programs.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      durationHours: p.durationHours,
      maxParticipants: p.maxParticipants,
      pricePerPax: p.pricePerPax,
      status: p.status,
      locationType: p.locationType,
      moduleCount: p._count.modules,
      bookingCount: p._count.bookings,
      createdAt: p.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const { title, description, category, durationHours, maxParticipants, pricePerPax, locationType, syllabus } = body;

  const program = await prisma.program.create({
    data: {
      trainerId: session.id,
      title,
      description: description || "",
      category: category || "Other",
      durationHours: durationHours || 4,
      maxParticipants: maxParticipants || 20,
      pricePerPax: pricePerPax || 0,
      locationType: locationType || "onsite",
      syllabus: JSON.stringify(syllabus || []),
      status: "DRAFT",
    },
  });

  return NextResponse.json(program, { status: 201 });
}
