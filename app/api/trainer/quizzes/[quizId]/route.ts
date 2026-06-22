import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET single quiz with questions
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      module: { select: { program: { select: { trainerId: true, title: true } } } },
    },
  });
  if (!quiz || quiz.module.program.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
  const session = await getSession();
  if (!session || session.role !== "TRAINER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { module: { select: { program: { select: { trainerId: true } } } } } });
  if (!quiz || quiz.module.program.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

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
  const session = await getSession();
  if (!session || session.role !== "TRAINER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { module: { select: { program: { select: { trainerId: true } } } } } });
  if (!quiz || quiz.module.program.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.quiz.delete({ where: { id: quizId } });
  return NextResponse.json({ success: true });
}
