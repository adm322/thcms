import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody, parsePagination, paginate } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();
  const status = searchParams.get("status") || undefined;
  const department = searchParams.get("department") || undefined;
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
  const { page, limit, skip } = parsePagination(searchParams);

  const where: any = {
    companyId: session.companyId,
    targetYear: year,
  };
  if (status) where.status = status;
  if (department) where.department = department;
  if (month !== undefined) where.targetMonth = month;

  const [items, total] = await Promise.all([
    prisma.trainingPlanItem.findMany({
      where,
      include: {
      booking: {
        select: {
          id: true,
          programDate: true,
          totalFee: true,
          status: true,
          program: { select: { title: true, category: true, trainer: { select: { name: true } } } },
        },
      },
    },
    orderBy: [{ targetMonth: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    skip,
    take: limit,
  }),
  prisma.trainingPlanItem.count({ where }),
  ]);

  return NextResponse.json({
    data: items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      booking: item.booking
        ? {
            id: item.booking.id,
            programDate: item.booking.programDate.toISOString(),
            totalFee: item.booking.totalFee,
            status: item.booking.status,
            programTitle: item.booking.program.title,
            programCategory: item.booking.program.category,
            trainerName: item.booking.program.trainer.name,
          }
        : null,
    })),
    pagination: paginate(page, limit, total),
  });
}

export async function POST(request: NextRequest) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const { title, category, department, targetCount, targetMonth, targetYear, estimatedCost, priority, matchedProgramId, notes } = body as {
    title: string; category: string; department?: string | null; targetCount: number; targetMonth: number; targetYear: number;
    estimatedCost?: number; priority?: string; matchedProgramId?: string | null; notes?: string | null;
  };

  if (!title || !category || targetCount === undefined || targetMonth === undefined || targetYear === undefined) {
    return NextResponse.json({ error: "title, category, targetCount, targetMonth, and targetYear are required" }, { status: 400 });
  }

  const item = await prisma.trainingPlanItem.create({
    data: {
      companyId: session.companyId,
      hrId: session.id,
      title,
      category,
      department: department || null,
      targetCount: targetCount || 1,
      targetMonth,
      targetYear,
      estimatedCost: estimatedCost || 0,
      priority: priority || "MEDIUM",
      status: "DRAFT",
      matchedProgramId: matchedProgramId || null,
      notes: notes || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
