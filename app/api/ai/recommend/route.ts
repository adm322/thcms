import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getSmartRecommendations } from "@/lib/ai";

export async function GET() {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  // Get past booking categories
  const bookings = await prisma.booking.findMany({
    where: { companyId: session.companyId },
    include: { program: { select: { category: true } } },
  });
  const pastCategories = [...new Set(bookings.map(b => b.program.category))];

  // Get employee stats
  const employees = await prisma.employee.findMany({
    where: { companyId: session.companyId },
    select: { department: true },
  });
  const deptMap: Record<string, number> = {};
  employees.forEach(e => { deptMap[e.department || "Other"] = (deptMap[e.department || "Other"] || 0) + 1; });
  const departmentBreakdown = Object.entries(deptMap).map(([department, count]) => ({ department, count }));

  const recommendations = await getSmartRecommendations(pastCategories, employees.length, departmentBreakdown);
  return NextResponse.json({ recommendations, pastCategories, employeeCount: employees.length });
}
