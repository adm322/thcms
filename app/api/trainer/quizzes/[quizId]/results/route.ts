import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { module: { select: { program: { select: { trainerId: true } } } } },
  });
  if (!quiz || quiz.module.program.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const participants = await prisma.participant.findMany({
    where: { quizId },
    select: { id: true, name: true, department: true, attendanceStatus: true, quizScore: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(participants);
}
