import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;

  const bookings = await prisma.booking.findMany({
    where: { program: { trainerId: session.id }, status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] } },
    include: {
      program: { select: { title: true, category: true, locationType: true, durationHours: true } },
      company: { select: { name: true, address: true, state: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { programDate: "asc" },
  });

  const now = new Date();
  const upcoming = bookings
    .filter((b) => new Date(b.programDate) >= now && b.status !== "COMPLETED")
    .slice(0, 10);

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      id: b.id, title: b.program.title, category: b.program.category,
      locationType: b.program.locationType, date: b.programDate.toISOString(),
      status: b.status, companyName: b.company.name,
      trainerName: session.name, participantCount: b._count.participants,
    })),
    upcoming: upcoming.map((b) => ({
      id: b.id, title: b.program.title, category: b.program.category,
      locationType: b.program.locationType, durationHours: b.program.durationHours,
      trainerName: session.name, companyName: b.company.name,
      companyAddress: b.company.address, companyState: b.company.state,
      date: b.programDate.toISOString(), status: b.status,
      totalFee: b.totalFee, participantCount: b._count.participants,
    })),
  });
}
