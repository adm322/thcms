import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const skip = (page - 1) * limit;

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
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
