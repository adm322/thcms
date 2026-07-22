import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

// GET questions
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const session = await requireRole();
  if (session instanceof NextResponse) return session;
  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { module: { select: { program: { select: { trainerId: true } } } } } });
  if (!quiz || (quiz.standalone ? false : quiz.module?.program?.trainerId !== session.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const questions = await prisma.question.findMany({
    where: { quizId },
    orderBy: { orderIndex: "asc" },
      take: 100,
      skip: 0
});

  return NextResponse.json(questions.map((q) => ({ ...q, options: JSON.parse(q.options || "[]") })));
}

// POST new question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const session = await requireRole();
  if (session instanceof NextResponse) return session;
  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { module: { select: { program: { select: { trainerId: true } } } } } });
  if (!quiz || (quiz.standalone ? false : quiz.module?.program?.trainerId !== session.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const count = await prisma.question.count({ where: { quizId } });

  const b = body as Record<string, string | number | unknown[]>;
  const question = await prisma.question.create({
    data: {
      quizId,
      text: (b.text as string) || "New Question",
      type: (b.type as string) || "MCQ",
      options: JSON.stringify(b.options || []),
      correctAnswer: (b.correctAnswer as string) || "",
      points: (b.points as number) || 1,
      orderIndex: (b.orderIndex as number) ?? count,
    },
  });

  return NextResponse.json({ ...question, options: JSON.parse(question.options) }, { status: 201 });
}
