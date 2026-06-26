import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;

  const evaluations = await prisma.evaluation.findMany({
    where: { booking: { program: { trainerId: session.id } } },
    include: {
      booking: {
        select: {
          program: { select: { title: true, category: true } },
          company: { select: { name: true } },
          programDate: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    evaluations.map((e) => ({
      id: e.id,
      title: e.title,
      programTitle: e.booking.program.title,
      category: e.booking.program.category,
      companyName: e.booking.company.name,
      programDate: e.booking.programDate.toISOString(),
      bookingStatus: e.booking.status,
      summaryScore: e.summaryScore,
      sentAt: e.sentAt?.toISOString() ?? null,
      completedAt: e.completedAt?.toISOString() ?? null,
    }))
  );
}
