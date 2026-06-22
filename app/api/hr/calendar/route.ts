import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { companyId: session.companyId, status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] } },
    include: {
      program: { select: { title: true, category: true, locationType: true, durationHours: true, trainer: { select: { name: true } } } },
      _count: { select: { participants: true } },
    },
    orderBy: { programDate: "asc" },
  });

  const now = new Date();
  const upcoming = bookings
    .filter((b) => new Date(b.programDate) >= now)
    .slice(0, 10);

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      id: b.id, title: b.program.title, category: b.program.category,
      locationType: b.program.locationType, date: b.programDate.toISOString(),
      status: b.status, companyName: session.name,
      trainerName: b.program.trainer.name || "—", participantCount: b._count.participants,
    })),
    upcoming: upcoming.map((b) => ({
      id: b.id, title: b.program.title, category: b.program.category,
      locationType: b.program.locationType, durationHours: b.program.durationHours,
      trainerName: b.program.trainer.name || "—", companyName: session.name,
      date: b.programDate.toISOString(), status: b.status,
      totalFee: b.totalFee, participantCount: b._count.participants,
    })),
  });
}
