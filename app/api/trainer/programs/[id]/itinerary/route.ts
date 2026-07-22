import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const items = await prisma.itineraryItem.findMany({
    where: { programId: id },
    orderBy: { orderIndex: "asc" },
      take: 100,
      skip: 0
});
  return NextResponse.json(items);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;
  const { id: programId } = await params;

  const prog = await prisma.program.findUnique({ where: { id: programId } });
  if (!prog || prog.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const count = await prisma.itineraryItem.count({ where: { programId } });

  const b = body as Record<string, string | number>;
  const item = await prisma.itineraryItem.create({
    data: {
      programId,
      type: (b.type as string) || "MODULE",
      title: (b.title as string) || "New Item",
      startTime: (b.startTime as string) || "09:00",
      endTime: (b.endTime as string) || "10:00",
      orderIndex: (b.orderIndex as number) ?? count,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole();
  if (session instanceof NextResponse) return session;
  const { id: programId } = await params;

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  // Delete all existing and recreate
  await prisma.itineraryItem.deleteMany({ where: { programId } });

  const items = [];
  const items_input = ((body as Record<string, unknown>).items || []) as { type?: string; title: string; startTime: string; endTime: string }[];
  for (let i = 0; i < items_input.length; i++) {
    const it = items_input[i];
    const item = await prisma.itineraryItem.create({
      data: {
        programId,
        type: it.type || "MODULE",
        title: it.title,
        startTime: it.startTime,
        endTime: it.endTime,
        orderIndex: i,
      },
    });
    items.push(item);
  }

  // Calculate total duration from itinerary
  if (items.length > 0) {
    const first = items[0];
    const last = items[items.length - 1];
    const [fh, fm] = first.startTime.split(":").map(Number);
    const [lh, lm] = last.endTime.split(":").map(Number);
    const totalMins = (lh * 60 + lm) - (fh * 60 + fm);
    const totalHours = Math.round((totalMins / 60) * 10) / 10;
    await prisma.program.update({
      where: { id: programId },
      data: { durationHours: totalHours > 0 ? totalHours : undefined },
    });
  }

  return NextResponse.json(items);
}
