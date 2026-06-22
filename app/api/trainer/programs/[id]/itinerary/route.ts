import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const items = await prisma.itineraryItem.findMany({
    where: { programId: id },
    orderBy: { orderIndex: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: programId } = await params;

  const prog = await prisma.program.findUnique({ where: { id: programId } });
  if (!prog || prog.trainerId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const count = await prisma.itineraryItem.count({ where: { programId } });

  const item = await prisma.itineraryItem.create({
    data: {
      programId,
      type: body.type || "MODULE",
      title: body.title || "New Item",
      startTime: body.startTime || "09:00",
      endTime: body.endTime || "10:00",
      orderIndex: body.orderIndex ?? count,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: programId } = await params;

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Delete all existing and recreate
  await prisma.itineraryItem.deleteMany({ where: { programId } });

  const items = [];
  for (let i = 0; i < (body.items || []).length; i++) {
    const it = body.items[i];
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
