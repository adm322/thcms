import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;
  const { id: programId } = await params;

  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program || program.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const { moduleId, title, passingScore, timeLimitMins } = body as { moduleId: string; title: string; passingScore?: number; timeLimitMins?: number; description?: string };
  if (!moduleId || !title) return NextResponse.json({ error: "moduleId and title required" }, { status: 400 });

  const mod = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!mod || mod.programId !== programId) return NextResponse.json({ error: "Module not found" }, { status: 400 });

  const quiz = await prisma.quiz.create({
    data: {
      moduleId,
      title,
      description: (body as Record<string, string>).description || "",
      passingScore: passingScore || 50,
      timeLimitMins: timeLimitMins || 30,
      shareToken: crypto.randomBytes(6).toString("hex"),
    },
  });

  return NextResponse.json(quiz, { status: 201 });
}
