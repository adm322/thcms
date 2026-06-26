import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;
  const { moduleId } = await params;

  const mod = await prisma.module.findUnique({ where: { id: moduleId }, include: { program: true } });
  if (!mod || mod.program.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const updated = await prisma.module.update({
    where: { id: moduleId },
    data: {
      title: body.title ?? mod.title,
      description: body.description ?? mod.description,
      durationMins: body.durationMins ?? mod.durationMins,
      orderIndex: body.orderIndex ?? mod.orderIndex,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;
  const { moduleId } = await params;

  const mod = await prisma.module.findUnique({ where: { id: moduleId }, include: { program: true } });
  if (!mod || mod.program.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.module.delete({ where: { id: moduleId } });
  return NextResponse.json({ success: true });
}
