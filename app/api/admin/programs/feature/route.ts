import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-guards";
import { z } from "zod";

const FeatureToggleSchema = z.object({
  id: z.string().min(1).max(64),
  featured: z.boolean().optional(),
});

// GET featured + recent programs
export const GET = withAuth(
  "ADMIN",
  async () => {
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
);

// PATCH toggle feature
export const PATCH = withAuth(
  "ADMIN",
  async ({ request }) => {
    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = FeatureToggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { id, featured } = parsed.data;

    const program = await prisma.program.update({
      where: { id },
      data: {
        featured: featured ?? false,
        featuredAt: featured ? new Date() : null,
      },
    });

    return NextResponse.json(program);
  }
);

function mapProgram(p: {
  id: string; title: string; category: string | null; description: string | null;
  durationHours: number | null; pricePerPax: number | null; locationType: string | null;
  createdAt: Date; featured: boolean;
  trainer: { name: string; trainerProfile: { rating: number | null } | null };
  _count: { bookings: number };
}) {
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
