import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const evaluations = await prisma.evaluation.findMany({
    where: { booking: { companyId: session.companyId } },
    include: { booking: { select: { program: { select: { title: true } } } } },
    orderBy: { createdAt: "desc" },
      take: 100,
      skip: 0
});

  return NextResponse.json(
    evaluations.map((e) => ({
      id: e.id,
      title: e.title,
      programTitle: e.booking.program.title,
      summaryScore: e.summaryScore,
      sentAt: e.sentAt?.toISOString() ?? null,
      completedAt: e.completedAt?.toISOString() ?? null,
    }))
  );
}
