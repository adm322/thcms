import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { moduleId } = await params;

  const mod = await prisma.module.findUnique({ where: { id: moduleId }, include: { program: true } });
  if (!mod || mod.program.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

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
  const session = await getSession();
  if (!session || session.role !== "TRAINER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { moduleId } = await params;

  const mod = await prisma.module.findUnique({ where: { id: moduleId }, include: { program: true } });
  if (!mod || mod.program.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.module.delete({ where: { id: moduleId } });
  return NextResponse.json({ success: true });
}
