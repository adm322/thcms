import { NextRequest, NextResponse } from "next/server";
import { requireRole, parsePagination, paginate } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const { page, limit, skip } = parsePagination(new URL(request.url).searchParams, 10000);

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where: { companyId: session.companyId },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.employee.count({
      where: { companyId: session.companyId },
    }),
  ]);

  return NextResponse.json({
    data: employees,
    pagination: paginate(page, limit, total),
  });
}
