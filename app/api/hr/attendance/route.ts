import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth()));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const employeeId = searchParams.get("employeeId");

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const where: any = { employee: { companyId: session.companyId }, date: { gte: start, lte: end } };
  if (employeeId) where.employeeId = employeeId;

  const records = await prisma.attendance.findMany({
    where,
    include: { employee: { select: { name: true, department: true } } },
    orderBy: { date: "asc" },
      take: 100,
      skip: 0
});

  // Build employee summary
  const empMap: Record<string, { name: string; dept: string; present: number; late: number; absent: number }> = {};
  records.forEach((r) => {
    if (!empMap[r.employeeId]) empMap[r.employeeId] = { name: r.employee.name, dept: r.employee.department ?? "", present: 0, late: 0, absent: 0 };
    if (r.status === "PRESENT") empMap[r.employeeId].present++;
    else if (r.status === "LATE") empMap[r.employeeId].late++;
    else empMap[r.employeeId].absent++;
  });

  return NextResponse.json({
    records: records.map((r) => ({
      id: r.id, employeeId: r.employeeId, employeeName: r.employee.name, department: r.employee.department,
      date: r.date.toISOString().slice(0, 10), clockIn: r.clockIn?.toISOString() || null,
      clockOut: r.clockOut?.toISOString() || null, status: r.status,
    })),
    summary: Object.entries(empMap).map(([id, data]) => ({ employeeId: id, ...data })),
  });
}
