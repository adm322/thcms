import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { QuizSubmitSchema } from "@/lib/validations";
import { generateCertificate } from "@/lib/certificate";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`quiz:submit:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { token } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = QuizSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission" },
      { status: 400 }
    );
  }
  const { answers } = parsed.data;

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
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = score >= quiz.passingScore;

  let attemptNumber = 1;
  let previousAttempts: { score: number; passed: boolean; attemptNumber: number; createdAt: string }[] = [];

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
        // Find previous attempts to determine attempt number and fetch history
        const existingResults = await prisma.quizResult.findMany({
          where: {
            participantId: participant.id,
            quizId: quiz.id
          },
          orderBy: { attemptNumber: "desc" },
          select: { attemptNumber: true, score: true, passed: true, createdAt: true },
            take: 100,
            skip: 0
        });

        if (existingResults.length > 0) {
          attemptNumber = existingResults[0].attemptNumber + 1;
          previousAttempts = existingResults.map(r => ({
            score: r.score,
            passed: r.passed,
            attemptNumber: r.attemptNumber,
            createdAt: r.createdAt.toISOString()
          }));
        }

        // Create a new QuizResult record per attempt
        await prisma.quizResult.create({
          data: {
            participantId: participant.id,
            quizId: quiz.id,
            score,
            answers: answers as object,
            attemptNumber,
            passed
          }
        });

        // ── Certificate auto-generation ─────────────────────────────────
        // Check if participant qualifies: PRESENT attendance + all quizzes passed
        if (participant.attendanceStatus === "PRESENT") {
          try {
            // Fetch ALL quizzes for this program
            const programQuizzes = await prisma.quiz.findMany({
              where: {
                module: { programId: quiz.module!.program.id },
              },
              select: { id: true, passingScore: true },
                take: 100,
                skip: 0
            });

            if (programQuizzes.length > 0) {
              // For each quiz, check that the participant has at least one passed result
              const quizResults = await prisma.quizResult.findMany({
                where: {
                  participantId: participant.id,
                  quizId: { in: programQuizzes.map((q) => q.id) },
                  passed: true,
                },
                select: { quizId: true },
                  take: 100,
                  skip: 0
            });

              const passedQuizIds = new Set(quizResults.map((r) => r.quizId));
              const allPassed = programQuizzes.every((q) => passedQuizIds.has(q.id));

              if (allPassed && !participant.certificateUrl) {
                const certUrl = await generateCertificate(participant.id);
                if (certUrl) {
                  await prisma.participant.update({
                    where: { id: participant.id },
                    data: { certificateUrl: certUrl },
                  });
                  console.log(`Certificate auto-generated for participant ${participant.id}: ${certUrl}`);
                }
              }
            }
          } catch (certErr) {
            console.error("Certificate auto-generation failed:", certErr);
            // Non-fatal — the quiz result is still saved
          }
        }
      }
    }
  } catch (err) {
    console.error("Skipped participant score update for standalone quiz / error", err);
  }

  return NextResponse.json({ score, total, correct, passed, attemptNumber, previousAttempts });
}
