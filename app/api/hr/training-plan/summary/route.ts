import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();

  // Get all plan items for this year
  const planItems = await prisma.trainingPlanItem.findMany({
    where: { companyId: session.companyId, targetYear: year },
  });

  // Get all actual bookings for this year (for spent tracking)
  const bookings = await prisma.booking.findMany({
    where: {
      companyId: session.companyId,
      programDate: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
      status: { not: "CANCELLED" },
    },
  });

  // Calculate budget metrics
  const totalSpent = bookings.reduce((sum, b) => sum + b.totalFee, 0);
  const plannedCost = planItems.reduce((sum, p) => sum + p.estimatedCost, 0);
  
  // Annual budget — stored in localStorage or use a default (RM 85,000 for mid-size company)
  // In production this would come from company settings
  const annualBudget = 85000;
  const remainingBudget = Math.max(0, annualBudget - totalSpent - plannedCost);
  const utilizationPercent = Math.round((totalSpent / annualBudget) * 100);

  // By department
  const byDepartment: Record<string, { planned: number; spent: number; count: number }> = {};
  for (const p of planItems) {
    const dept = p.department || "Unassigned";
    if (!byDepartment[dept]) byDepartment[dept] = { planned: 0, spent: 0, count: 0 };
    byDepartment[dept].planned += p.estimatedCost;
    byDepartment[dept].count += 1;
  }
  for (const b of bookings) {
    // We can't easily map bookings to departments without plan links
    // So we aggregate under "Booked (no plan)"
    const dept = "Booked (no plan)";
    if (!byDepartment[dept]) byDepartment[dept] = { planned: 0, spent: 0, count: 0 };
    byDepartment[dept].spent += b.totalFee;
  }

  // By month
  const byMonth: Record<number, { planned: number; spent: number; plannedCount: number; bookedCount: number }> = {};
  for (let m = 0; m < 12; m++) {
    byMonth[m] = { planned: 0, spent: 0, plannedCount: 0, bookedCount: 0 };
  }
  for (const p of planItems) {
    byMonth[p.targetMonth].planned += p.estimatedCost;
    byMonth[p.targetMonth].plannedCount += 1;
  }
  for (const b of bookings) {
    const m = new Date(b.programDate).getMonth();
    byMonth[m].spent += b.totalFee;
    byMonth[m].bookedCount += 1;
  }

  // Status counts
  const statusCounts: Record<string, number> = {};
  for (const p of planItems) {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  }

  // HRDF levy estimate (1% of payroll — rough estimate based on employee count)
  const employeeCount = await prisma.employee.count({ where: { companyId: session.companyId, status: "ACTIVE" } });
  const estimatedPayroll = employeeCount * 4500 * 12; // rough: RM 4,500 avg monthly × 12
  const hrdfLevyEstimate = Math.round(estimatedPayroll * 0.01);

  return NextResponse.json({
    annualBudget,
    totalSpent,
    plannedCost,
    remainingBudget,
    utilizationPercent,
    hrdfLevyEstimate,
    employeeCount,
    planItemCount: planItems.length,
    completedPlans: statusCounts.COMPLETED || 0,
    scheduledPlans: statusCounts.SCHEDULED || 0,
    draftPlans: statusCounts.DRAFT || 0,
    matchedPlans: statusCounts.MATCHED || 0,
    cancelledPlans: statusCounts.CANCELLED || 0,
    byDepartment: Object.entries(byDepartment).map(([dept, data]) => ({ department: dept, ...data })),
    byMonth,
    statusCounts,
  });
}
