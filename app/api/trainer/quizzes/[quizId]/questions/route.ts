import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET questions
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { module: { select: { program: { select: { trainerId: true } } } } } });
  if (!quiz || (quiz.standalone ? false : quiz.module?.program?.trainerId !== session.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const questions = await prisma.question.findMany({
    where: { quizId },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json(questions.map((q) => ({ ...q, options: JSON.parse(q.options || "[]") })));
}

// POST new question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { module: { select: { program: { select: { trainerId: true } } } } } });
  if (!quiz || (quiz.standalone ? false : quiz.module?.program?.trainerId !== session.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const count = await prisma.question.count({ where: { quizId } });

  const question = await prisma.question.create({
    data: {
      quizId,
      text: body.text || "New Question",
      type: body.type || "MCQ",
      options: JSON.stringify(body.options || []),
      correctAnswer: body.correctAnswer || "",
      points: body.points || 1,
      orderIndex: body.orderIndex ?? count,
    },
  });

  return NextResponse.json({ ...question, options: JSON.parse(question.options) }, { status: 201 });
}
