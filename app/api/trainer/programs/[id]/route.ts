import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;

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
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  // Verify ownership
  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing || existing.trainerId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const b = body as Record<string, string | number | string[] | null | undefined>;
  const program = await prisma.program.update({
    where: { id },
    data: {
      title: b.title as string,
      description: b.description as string,
      category: b.category as string,
      durationHours: b.durationHours as number,
      maxParticipants: b.maxParticipants as number,
      pricePerPax: b.pricePerPax as number,
      locationType: b.locationType as string,
      syllabus: JSON.stringify(b.syllabus || []),
      status: b.status as string,
      proposalUrl: b.proposalUrl !== undefined ? (b.proposalUrl as string) : undefined,
      proposalLabel: b.proposalLabel !== undefined ? (b.proposalLabel as string) : undefined,
    },
  });

  return NextResponse.json(program);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing || existing.trainerId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Cascade delete: bookings → participants, evaluations, invoices, messages, reviews
  const bookings = await prisma.booking.findMany({ where: { programId: id }, select: { id: true } });
  const bookingIds = bookings.map((b) => b.id);
  if (bookingIds.length > 0) {
    await prisma.review.deleteMany({ where: { bookingId: { in: bookingIds } } });
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
}
