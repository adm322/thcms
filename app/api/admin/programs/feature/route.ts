import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET featured + recent programs
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [featured, recent] = await Promise.all([
    prisma.program.findMany({
      where: { featured: true, status: "PUBLISHED" },
      include: {
        trainer: { select: { name: true, trainerProfile: { select: { rating: true } } } },
        _count: { select: { bookings: true } },
      },
      orderBy: { featuredAt: "desc" },
      take: 6,
    }),
    prisma.program.findMany({
      where: { status: "PUBLISHED" },
      include: {
        trainer: { select: { name: true, trainerProfile: { select: { rating: true } } } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return NextResponse.json({
    featured: featured.map(mapProgram),
    recent: recent.map(mapProgram),
  });
}

// PATCH toggle feature
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { id, featured } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const program = await prisma.program.update({
    where: { id },
    data: {
      featured: featured ?? false,
      featuredAt: featured ? new Date() : null,
    },
  });

  return NextResponse.json(program);
}

function mapProgram(p: any) {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    description: p.description,
    durationHours: p.durationHours,
    pricePerPax: p.pricePerPax,
    locationType: p.locationType,
    trainerName: p.trainer.name,
    trainerRating: p.trainer.trainerProfile?.rating ?? 0,
    bookingCount: p._count.bookings,
    createdAt: p.createdAt.toISOString(),
    featured: p.featured,
  };
}
