import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const session = await requireRole();
  if (session instanceof NextResponse) return session;
  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { module: { select: { program: { select: { trainerId: true } } } } },
  });
  if (!quiz || (quiz.standalone ? false : quiz.module?.program?.trainerId !== session.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const results = await prisma.quizResult.findMany({
    where: { quizId },
    include: { participant: { select: { id: true, name: true, department: true, attendanceStatus: true } } },
    orderBy: { participant: { name: "asc" } },
      take: 100,
      skip: 0
});

  const participants = results.map(r => ({ ...r.participant, quizScore: r.score }));

  return NextResponse.json(participants);
}
