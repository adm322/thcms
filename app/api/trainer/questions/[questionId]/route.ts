import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { questionId } = await params;

  const q = await prisma.question.findUnique({ where: { id: questionId }, include: { quiz: { include: { module: { select: { program: { select: { trainerId: true } } } } } } } });
  if (!q || (q.quiz.standalone ? false : q.quiz.module?.program?.trainerId !== session.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const updated = await prisma.question.update({
    where: { id: questionId },
    data: {
      text: body.text ?? q.text,
      type: body.type ?? q.type,
      options: body.options ? JSON.stringify(body.options) : q.options,
      correctAnswer: body.correctAnswer ?? q.correctAnswer,
      points: body.points ?? q.points,
      orderIndex: body.orderIndex ?? q.orderIndex,
    },
  });

  return NextResponse.json({ ...updated, options: JSON.parse(updated.options || "[]") });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { questionId } = await params;

  const q = await prisma.question.findUnique({ where: { id: questionId }, include: { quiz: { include: { module: { select: { program: { select: { trainerId: true } } } } } } } });
  if (!q || (q.quiz.standalone ? false : q.quiz.module?.program?.trainerId !== session.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.question.delete({ where: { id: questionId } });
  return NextResponse.json({ success: true });
}
