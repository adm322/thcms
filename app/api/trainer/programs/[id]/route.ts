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

  // Cascade delete: bookings → participants, evaluations, invoices, reimbursements, messages, reviews
  const bookings = await prisma.booking.findMany({ where: { programId: id }, select: { id: true } });
  for (const b of bookings) {
    await prisma.review.deleteMany({ where: { bookingId: b.id } });
    await prisma.reimbursement.deleteMany({ where: { bookingId: b.id } });
    await prisma.invoice.deleteMany({ where: { bookingId: b.id } });
    await prisma.message.deleteMany({ where: { bookingId: b.id } });
    await prisma.evaluation.deleteMany({ where: { bookingId: b.id } });
    await prisma.participant.deleteMany({ where: { bookingId: b.id } });
  }
  await prisma.booking.deleteMany({ where: { programId: id } });
  
  // Modules cascade to quizzes, questions, materials
  const modules = await prisma.module.findMany({ where: { programId: id }, select: { id: true } });
  for (const m of modules) {
    // Participants reference quizzes
    await prisma.participant.updateMany({ where: { quizId: { in: (await prisma.quiz.findMany({ where: { moduleId: m.id }, select: { id: true } })).map(q => q.id) } }, data: { quizId: null } });
    await prisma.question.deleteMany({ where: { quiz: { moduleId: m.id } } });
    await prisma.quiz.deleteMany({ where: { moduleId: m.id } });
    await prisma.material.deleteMany({ where: { moduleId: m.id } });
  }
  await prisma.module.deleteMany({ where: { programId: id } });

  await prisma.program.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
