import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const quiz = await prisma.quiz.findUnique({ 
    where: { shareToken: token },
    include: {
      module: {
        include: {
          program: true
        }
      }
    }
  });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const questions = await prisma.question.findMany({ where: { quizId: quiz.id }, orderBy: { orderIndex: "asc" } });

  let bookingId: string | null = null;
  try {
    const session = await getSession();
    if (session && session.role === "PARTICIPANT" && quiz.module?.program) {
      const participant = await prisma.participant.findFirst({
        where: {
          booking: {
            programId: quiz.module.program.id
          },
          OR: [
            { userId: session.id },
            { email: session.email }
          ]
        }
      });
      if (participant) {
        bookingId = participant.bookingId;
      }
    }
  } catch (e) {
    console.error("Error fetching booking ID for participant", e);
  }

  return NextResponse.json({
    quiz: { id: quiz.id, title: quiz.title, description: quiz.description, passingScore: quiz.passingScore, timeLimitMins: quiz.timeLimitMins },
    questions: questions.map(q => ({ id: q.id, text: q.text, type: q.type, options: q.options, points: q.points })),
    bookingId
  });
}
