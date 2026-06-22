import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: list programs with vote counts
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "HR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all published programs with vote counts
  const programs = await prisma.program.findMany({
    where: { status: "PUBLISHED" },
    include: {
      trainer: { select: { name: true } },
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get user's existing votes
  const userVotes = await prisma.programVote.findMany({
    where: { hrId: session.id },
    select: { programId: true },
  });
  const votedIds = new Set(userVotes.map((v) => v.programId));

  return NextResponse.json(
    programs.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      trainerName: p.trainer.name,
      voteCount: p._count.votes,
      voted: votedIds.has(p.id),
      status: p.status,
    }))
  );
}

// POST: cast a vote
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "HR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { programId } = body;
  if (!programId) return NextResponse.json({ error: "programId required" }, { status: 400 });

  // Check existing vote
  const existing = await prisma.programVote.findUnique({
    where: { hrId_programId: { hrId: session.id, programId } },
  });

  if (existing) {
    // Remove vote (toggle)
    await prisma.programVote.delete({ where: { id: existing.id } });
    return NextResponse.json({ voted: false });
  }

  await prisma.programVote.create({
    data: { hrId: session.id, programId },
  });

  return NextResponse.json({ voted: true });
}
