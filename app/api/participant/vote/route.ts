import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: list published programs with company employee vote counts
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all published programs
  const programs = await prisma.program.findMany({
    where: { status: "PUBLISHED" },
    include: {
      trainer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const companyId = session.companyId;
  const employeeVoteMap = new Map<string, number>();

  if (companyId) {
    // Count votes from employees within the same company (role: PARTICIPANT)
    const companyVotes = await prisma.programVote.groupBy({
      by: ["programId"],
      where: {
        hr: {
          role: "PARTICIPANT",
          companyId: companyId,
        },
      },
      _count: {
        id: true,
      },
    });

    companyVotes.forEach((v) => {
      employeeVoteMap.set(v.programId, v._count.id);
    });
  }

  // Get current participant's own votes
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
      description: p.description,
      voteCount: employeeVoteMap.get(p.id) || 0,
      voted: votedIds.has(p.id),
    }))
  );
}

// POST: toggle a participant's vote
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { programId } = body;
  if (!programId) {
    return NextResponse.json({ error: "programId required" }, { status: 400 });
  }

  // Check existing vote
  const existing = await prisma.programVote.findUnique({
    where: { hrId_programId: { hrId: session.id, programId } },
  });

  if (existing) {
    // Remove vote (toggle)
    await prisma.programVote.delete({ where: { id: existing.id } });
    return NextResponse.json({ voted: false });
  }

  // Create new vote
  await prisma.programVote.create({
    data: { hrId: session.id, programId },
  });

  return NextResponse.json({ voted: true });
}
