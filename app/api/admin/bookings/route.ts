import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "20"), 100);
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      include: {
        program: { select: { title: true, locationType: true, trainer: { select: { name: true } } } },
        company: { select: { name: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
      skip, take: limit,
    }),
    prisma.booking.count(),
  ]);

  return NextResponse.json({
    data: bookings.map((b) => ({
      id: b.id,
      programTitle: b.program.title,
      companyName: b.company.name,
      trainerName: b.program.trainer.name,
      date: b.programDate.toISOString(),
      status: b.status,
      totalFee: b.totalFee,
      depositStatus: b.depositStatus,
      depositPaid: b.depositPaid,
      participantCount: b._count.participants,
      venueAddress: b.venueAddress || b.program.locationType.toUpperCase(),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
