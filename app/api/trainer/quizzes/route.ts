import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quizzes = await prisma.quiz.findMany({
    where: { moduleId: null, standalone: true }, // only standalone quizzes
    include: { _count: { select: { questions: true, quizResults: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quizzes.map(q => ({
    id: q.id, title: q.title, description: q.description,
    passingScore: q.passingScore, timeLimitMins: q.timeLimitMins,
    shareToken: q.shareToken, questionCount: q._count.questions,
    responseCount: q._count.quizResults, createdAt: q.createdAt.toISOString(),
    shareUrl: q.shareToken ? `/quiz/${q.shareToken}` : null,
  })));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { title, description, passingScore, timeLimitMins, questions } = body;

  try {
    const quiz = await prisma.quiz.create({
      data: {
        title, description, passingScore: passingScore || 50, timeLimitMins: timeLimitMins || 30,
        standalone: true, shareToken: crypto.randomBytes(6).toString("hex"),
      },
    });

    if (questions?.length) {
      await prisma.question.createMany({
        data: questions.map((q: any, i: number) => ({
          quizId: quiz.id, text: q.text, type: q.type || "MCQ",
          options: JSON.stringify(q.options || []), correctAnswer: q.correctAnswer || "",
          points: q.points || 1, orderIndex: i,
        })),
      });
    }

    return NextResponse.json({ ...quiz, shareUrl: `/quiz/${quiz.shareToken}` }, { status: 201 });
  } catch (err) {
    console.error("Failed to create quiz:", err);
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}
