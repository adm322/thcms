import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month"); // YYYY-MM
  const year = searchParams.get("year");

  // Build date filter
  const dateFilter: any = {};
  if (month) {
    const [y, m] = month.split("-").map(Number);
    dateFilter.programDate = {
      gte: new Date(y, m - 1, 1),
      lt: new Date(y, m, 1),
    };
  } else if (year) {
    const y = Number(year);
    dateFilter.programDate = {
      gte: new Date(y, 0, 1),
      lt: new Date(y + 1, 0, 1),
    };
  }

  const bookings = await prisma.booking.findMany({
    where: {
      ...dateFilter,
      status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
    },
    include: {
      program: {
        select: {
          title: true,
          category: true,
          locationType: true,
          durationHours: true,
          trainer: { select: { id: true, name: true, email: true } },
        },
      },
      company: { select: { name: true, address: true, state: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { programDate: "asc" },
  });

  // Get upcoming trainings (next 14 days, confirmed + pending)
  const now = new Date();
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      programDate: { gte: now },
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    include: {
      program: {
        select: {
          title: true,
          category: true,
          locationType: true,
          durationHours: true,
          trainer: { select: { id: true, name: true, email: true } },
        },
      },
      company: { select: { name: true, address: true, state: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { programDate: "asc" },
    take: 15,
  });

  // Monthly stats
  const monthStart = month
    ? new Date(Number(month.split("-")[0]), Number(month.split("-")[1]) - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

  const monthBookings = await prisma.booking.findMany({
    where: {
      programDate: { gte: monthStart, lte: monthEnd },
      status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
    },
    include: {
      program: { select: { durationHours: true, category: true } },
    },
  });

  const monthlyStats = {
    totalTrainings: monthBookings.length,
    totalHours: monthBookings.reduce((s, b) => s + b.program.durationHours, 0),
    completedCount: monthBookings.filter((b) => b.status === "COMPLETED").length,
    confirmedCount: monthBookings.filter((b) => b.status === "CONFIRMED").length,
    pendingCount: monthBookings.filter((b) => b.status === "PENDING").length,
    byCategory: monthBookings.reduce<Record<string, number>>((acc, b) => {
      const cat = b.program.category;
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {}),
  };

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      id: b.id,
      title: b.program.title,
      category: b.program.category,
      locationType: b.program.locationType,
      durationHours: b.program.durationHours,
      trainerName: b.program.trainer.name,
      trainerId: b.program.trainer.id,
      trainerEmail: b.program.trainer.email,
      companyName: b.company.name,
      companyAddress: b.company.address,
      companyState: b.company.state,
      date: b.programDate.toISOString(),
      status: b.status,
      totalFee: b.totalFee,
      depositPaid: b.depositPaid,
      depositStatus: b.depositStatus,
      participantCount: b._count.participants,
    })),
    upcoming: upcomingBookings.map((b) => ({
      id: b.id,
      title: b.program.title,
      category: b.program.category,
      locationType: b.program.locationType,
      durationHours: b.program.durationHours,
      trainerName: b.program.trainer.name,
      trainerId: b.program.trainer.id,
      trainerEmail: b.program.trainer.email,
      companyName: b.company.name,
      companyAddress: b.company.address,
      companyState: b.company.state,
      date: b.programDate.toISOString(),
      status: b.status,
      totalFee: b.totalFee,
      participantCount: b._count.participants,
    })),
    monthlyStats,
  });
}
