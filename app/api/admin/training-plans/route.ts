import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();
  const companyId = searchParams.get("companyId") || undefined;

  // Get all companies with training plan items
  const companies = await prisma.company.findMany({
    where: companyId ? { id: companyId } : {},
    include: {
      trainingPlans: {
        where: { targetYear: year },
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
        orderBy: [{ targetMonth: "asc" }, { priority: "desc" }],
      },
      bookings: {
        where: {
          programDate: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          },
          status: { not: "CANCELLED" },
        },
        select: { totalFee: true, programDate: true, status: true },
      },
      _count: { select: { employees: true } },
    },
  });

  // Build per-company summaries
  const data = companies.map((company) => {
    const plans = company.trainingPlans.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      booking: p.booking
        ? {
            id: p.booking.id,
            programDate: p.booking.programDate.toISOString(),
            totalFee: p.booking.totalFee,
            status: p.booking.status,
            programTitle: p.booking.program.title,
            programCategory: p.booking.program.category,
            trainerName: p.booking.program.trainer.name,
          }
        : null,
    }));

    const totalSpent = company.bookings.reduce((s, b) => s + b.totalFee, 0);
    const plannedCost = plans.reduce((s, p) => s + p.estimatedCost, 0);
    const completedPlans = plans.filter((p) => p.status === "COMPLETED").length;
    const scheduledPlans = plans.filter((p) => p.status === "SCHEDULED").length;
    const draftPlans = plans.filter((p) => p.status === "DRAFT").length;
    const matchedPlans = plans.filter((p) => p.status === "MATCHED").length;

    // Department breakdown
    const depts: Record<string, { count: number; cost: number }> = {};
    for (const p of plans) {
      const d = p.department || "Unassigned";
      if (!depts[d]) depts[d] = { count: 0, cost: 0 };
      depts[d].count += 1;
      depts[d].cost += p.estimatedCost;
    }

    return {
      companyId: company.id,
      companyName: company.name,
      employeeCount: company._count.employees,
      planCount: plans.length,
      totalSpent,
      plannedCost,
      completedPlans,
      scheduledPlans,
      draftPlans,
      matchedPlans,
      departments: Object.entries(depts).map(([dept, d]) => ({ department: dept, ...d })),
      items: plans,
    };
  });

  // Platform-wide totals
  const platformTotalSpent = data.reduce((s, c) => s + c.totalSpent, 0);
  const platformPlannedCost = data.reduce((s, c) => s + c.plannedCost, 0);
  const platformPlanCount = data.reduce((s, c) => s + c.planCount, 0);

  return NextResponse.json({
    companies: data,
    platformSummary: {
      totalCompanies: data.length,
      totalSpent: platformTotalSpent,
      totalPlanned: platformPlannedCost,
      totalPlanItems: platformPlanCount,
      year,
    },
  });
}
