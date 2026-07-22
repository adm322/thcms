import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

// GET: list programs with vote counts
export async function GET() {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  // Get all published programs
  const programs = await prisma.program.findMany({
    where: { status: "PUBLISHED" },
    include: {
      trainer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
      take: 100,
      skip: 0
});

  // Count HR votes per program
  const hrVotes = await prisma.programVote.groupBy({
    by: ["programId"],
    where: {
      hr: {
        role: "HR",
      },
    },
    _count: {
      id: true,
    },
  });
  const hrVoteMap = new Map(hrVotes.map((v) => [v.programId, v._count.id]));

  // Count Employee votes of the same company per program
  const employeeVotes = await prisma.programVote.groupBy({
    by: ["programId"],
    where: {
      hr: {
        role: "PARTICIPANT",
        companyId: session.companyId,
      },
    },
    _count: {
      id: true,
    },
  });
  const employeeVoteMap = new Map(employeeVotes.map((v) => [v.programId, v._count.id]));

  // Get user's existing votes (the current HR)
  const userVotes = await prisma.programVote.findMany({
    where: { hrId: session.id },
    select: { programId: true },
      take: 100,
      skip: 0
});
  const votedIds = new Set(userVotes.map((v) => v.programId));

  return NextResponse.json(
    programs.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      trainerName: p.trainer.name,
      voteCount: hrVoteMap.get(p.id) || 0,
      employeeVotesCount: employeeVoteMap.get(p.id) || 0,
      voted: votedIds.has(p.id),
      status: p.status,
    }))
  );
}

// POST: cast a vote
export async function POST(request: NextRequest) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const { programId } = body as Record<string, string>;
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
