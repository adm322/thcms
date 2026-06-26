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
  const { title, description, orderIndex, durationMins } = body;

  try {
    const mod = await prisma.module.create({
      data: { programId, title, description, orderIndex: orderIndex || 0, durationMins: durationMins || 60 },
    });
    return NextResponse.json(mod, { status: 201 });
  } catch (err) {
    console.error("Failed to create module:", err);
    return NextResponse.json({ error: "Failed to create module" }, { status: 500 });
  }
}
