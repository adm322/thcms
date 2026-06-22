import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const location = searchParams.get("location");

  const where: any = { status: "PUBLISHED" };

  if (category) where.category = category;
  if (location) where.locationType = location;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }
  if (minPrice) where.pricePerPax = { ...(where.pricePerPax || {}), gte: Number(minPrice) };
  if (maxPrice) where.pricePerPax = { ...(where.pricePerPax || {}), lte: Number(maxPrice) };

  const programs = await prisma.program.findMany({
    where,
    include: {
      trainer: {
        select: {
          name: true,
          trainerProfile: { select: { rating: true, totalPrograms: true, accreditations: true } },
        },
      },
      _count: { select: { modules: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    programs.map((p) => ({
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
      accreditations: (() => { try { return JSON.parse(p.trainer.trainerProfile?.accreditations || "[]"); } catch { return []; } })(),
      moduleCount: p._count.modules,
      thumbnailUrl: p.thumbnailUrl,
      createdAt: p.createdAt.toISOString(),
    }))
  );
}
