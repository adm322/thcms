import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const featured = await prisma.program.findMany({
    where: { featured: true, status: "PUBLISHED" },
    include: {
      trainer: { select: { name: true, trainerProfile: { select: { rating: true, totalPrograms: true } } },
      },
      _count: { select: { bookings: true, modules: true } },
    },
    orderBy: { featuredAt: "desc" },
      take: 100,
      skip: 0
});

  return NextResponse.json(
    featured.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      durationHours: p.durationHours,
      maxParticipants: p.maxParticipants,
      pricePerPax: p.pricePerPax,
      locationType: p.locationType,
      trainerName: p.trainer.name,
      trainerRating: p.trainer.trainerProfile?.rating ?? 0,
      trainerPrograms: p.trainer.trainerProfile?.totalPrograms ?? 0,
      moduleCount: p._count.modules,
      bookingCount: p._count.bookings,
    }))
  );
}
