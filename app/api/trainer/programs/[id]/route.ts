import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      modules: {
        include: {
          quizzes: { include: { _count: { select: { questions: true } } } },
          materials: true,
        },
        orderBy: { orderIndex: "asc" },
      },
      itinerary: { orderBy: { orderIndex: "asc" } },
      _count: { select: { bookings: true } },
    },
  });

  if (!program || program.trainerId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...program,
    syllabus: JSON.parse(program.syllabus || "[]"),
    modules: program.modules.map((m) => ({
      ...m,
      quizzes: m.quizzes.map((q) => ({ ...q, questionCount: q._count.questions })),
      materials: m.materials,
    })),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing || existing.trainerId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const program = await prisma.program.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        durationHours: body.durationHours,
        maxParticipants: body.maxParticipants,
        pricePerPax: body.pricePerPax,
        locationType: body.locationType,
        syllabus: JSON.stringify(body.syllabus || []),
        status: body.status,
        proposalUrl: body.proposalUrl !== undefined ? body.proposalUrl : undefined,
        proposalLabel: body.proposalLabel !== undefined ? body.proposalLabel : undefined,
      },
    });
    return NextResponse.json(program);
  } catch (err) {
    console.error("Failed to update program:", err);
    return NextResponse.json({ error: "Failed to update program" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing || existing.trainerId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Cascade delete: bookings → participants, evaluations, invoices, reimbursements, messages, reviews
    const bookings = await prisma.booking.findMany({ where: { programId: id }, select: { id: true } });
    const bookingIds = bookings.map((b) => b.id);
    if (bookingIds.length > 0) {
      await prisma.review.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await prisma.reimbursement.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await prisma.invoice.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await prisma.message.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await prisma.evaluation.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await prisma.participant.deleteMany({ where: { bookingId: { in: bookingIds } } });
    }
    await prisma.booking.deleteMany({ where: { programId: id } });
    
    // Modules cascade to quizzes, questions, materials
    const modules = await prisma.module.findMany({ where: { programId: id }, select: { id: true } });
    const moduleIds = modules.map((m) => m.id);
    if (moduleIds.length > 0) {
      await prisma.question.deleteMany({ where: { quiz: { moduleId: { in: moduleIds } } } });
      await prisma.quiz.deleteMany({ where: { moduleId: { in: moduleIds } } });
      await prisma.material.deleteMany({ where: { moduleId: { in: moduleIds } } });
    }
    await prisma.module.deleteMany({ where: { programId: id } });

    await prisma.program.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete program:", err);
    return NextResponse.json({ error: "Failed to delete program" }, { status: 500 });
  }
}
