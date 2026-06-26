import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

// GET single quiz with questions
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;
  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      module: { select: { program: { select: { trainerId: true, title: true } } } },
    },
  });
  if (!quiz || (quiz.standalone ? false : quiz.module?.program?.trainerId !== session.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...quiz,
    questions: quiz.questions.map((q) => ({ ...q, options: JSON.parse(q.options || "[]") })),
  });
}

// PUT update quiz
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;
  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { module: { select: { program: { select: { trainerId: true } } } } } });
  if (!quiz || (quiz.standalone ? false : quiz.module?.program?.trainerId !== session.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const updated = await prisma.quiz.update({
    where: { id: quizId },
    data: {
      title: body.title ?? quiz.title,
      description: body.description ?? quiz.description,
      passingScore: body.passingScore ?? quiz.passingScore,
      timeLimitMins: body.timeLimitMins ?? quiz.timeLimitMins,
    },
  });

  return NextResponse.json(updated);
}

// DELETE quiz
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;
  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { module: { select: { program: { select: { trainerId: true } } } } } });
  if (!quiz || (quiz.standalone ? false : quiz.module?.program?.trainerId !== session.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.quiz.delete({ where: { id: quizId } });
  return NextResponse.json({ success: true });
}
