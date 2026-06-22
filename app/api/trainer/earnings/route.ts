import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { program: { trainerId: session.id } },
    include: {
      program: { select: { title: true } },
      company: { select: { name: true } },
    },
    orderBy: { programDate: "desc" },
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
