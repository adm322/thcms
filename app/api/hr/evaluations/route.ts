import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const evaluations = await prisma.evaluation.findMany({
    where: { booking: { companyId: session.companyId } },
    include: { booking: { select: { program: { select: { title: true } } } } },
    orderBy: { createdAt: "desc" },
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
