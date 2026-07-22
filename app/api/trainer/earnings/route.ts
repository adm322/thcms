import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;

  const bookings = await prisma.booking.findMany({
    where: { program: { trainerId: session.id } },
    include: {
      program: { select: { title: true } },
      company: { select: { name: true } },
    },
    orderBy: { programDate: "desc" },
      take: 100,
      skip: 0
});

  const data = bookings.map((b) => ({
    id: b.id,
    programTitle: b.program.title,
    companyName: b.company.name,
    date: b.programDate.toISOString(),
    totalFee: b.totalFee,
    depositPaid: b.depositPaid,
    status: b.status,
  }));

  const totalRevenue = data
    .filter((b) => b.status !== "CANCELLED")
    .reduce((s, b) => s + b.totalFee, 0);

  return NextResponse.json({
    stats: {
      totalRevenue,
      bookingCount: bookings.length,
      completedCount: bookings.filter((b) => b.status === "COMPLETED").length,
    },
    bookings: data,
  });
}
