import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;
  const trainerId = searchParams.get("trainerId") || undefined;

  const where: any = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (trainerId) where.trainerId = trainerId;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [programs, stats] = await Promise.all([
    prisma.program.findMany({
      where,
      include: {
        trainer: { select: { id: true, name: true, email: true } },
        _count: { select: { bookings: true, modules: true } },
      },
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.program.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  stats.forEach((s) => { statusCounts[s.status] = s._count; });

  return NextResponse.json({
    programs: programs.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      status: p.status,
      featured: p.featured,
      pricePerPax: p.pricePerPax,
      durationHours: p.durationHours,
      locationType: p.locationType,
      maxParticipants: p.maxParticipants,
      trainerId: p.trainer.id,
      trainerName: p.trainer.name,
      trainerEmail: p.trainer.email,
      bookingCount: p._count.bookings,
      moduleCount: p._count.modules,
      thumbnailUrl: p.thumbnailUrl,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    statusCounts,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { id, action } = body;

  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "feature") {
    await prisma.program.update({ where: { id }, data: { featured: !program.featured, featuredAt: program.featured ? null : new Date() } });
  } else if (action === "publish") {
    await prisma.program.update({ where: { id }, data: { status: "PUBLISHED" } });
  } else if (action === "archive") {
    await prisma.program.update({ where: { id }, data: { status: "ARCHIVED" } });
  } else if (action === "draft") {
    await prisma.program.update({ where: { id }, data: { status: "DRAFT" } });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
