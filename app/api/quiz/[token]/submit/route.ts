import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { answers } = await req.json();

  const quiz = await prisma.quiz.findUnique({ 
    where: { shareToken: token }, 
    include: { 
      questions: true,
      module: {
        include: {
          program: true
        }
      }
    } 
  });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let correct = 0;
  let total = 0;
  for (const q of quiz.questions) {
    total += q.points;
    if (answers[q.id] === q.correctAnswer) correct += q.points;
  }
  const score = Math.round((correct / total) * 100);

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
        await prisma.quizResult.upsert({
          where: {
            participantId_quizId: {
              participantId: participant.id,
              quizId: quiz.id
            }
          },
          update: {
            score: score
          },
          create: {
            participantId: participant.id,
            quizId: quiz.id,
            score: score
          }
        });
        console.log(`Updated score for participant ${participant.id} on quiz ${quiz.id}: ${score}%`);
      }
    }
  } catch (err) {
    console.error("Skipped participant score update for standalone quiz / error", err);
  }

  return NextResponse.json({ score, total, correct });
}
