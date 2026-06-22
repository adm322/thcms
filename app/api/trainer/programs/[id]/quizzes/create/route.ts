import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: programId } = await params;

  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program || program.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { moduleId, title, passingScore, timeLimitMins } = body;
  if (!moduleId || !title) return NextResponse.json({ error: "moduleId and title required" }, { status: 400 });

  const mod = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!mod || mod.programId !== programId) return NextResponse.json({ error: "Module not found" }, { status: 400 });

  const quiz = await prisma.quiz.create({
    data: {
      moduleId,
      title,
      description: body.description || "",
      passingScore: passingScore || 50,
      timeLimitMins: timeLimitMins || 30,
    },
  });

  return NextResponse.json(quiz, { status: 201 });
}
