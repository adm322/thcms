import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: programId } = await params;

  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program || program.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const modules = await prisma.module.findMany({
    where: { programId },
    include: { quizzes: { include: { _count: { select: { questions: true } } } } },
  });

  const quizzes = modules.flatMap((m) =>
    m.quizzes.map((q) => ({
      ...q,
      moduleTitle: m.title,
      questionCount: q._count.questions,
    }))
  );

  return NextResponse.json(quizzes);
}
