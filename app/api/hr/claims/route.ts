import { NextRequest, NextResponse } from "next/server";
import { requireRole, parsePagination, paginate } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams, 10000);
  const status = searchParams.get("status");

  const where: any = { employee: { companyId: session.companyId } };
  if (status && status !== "ALL") where.status = status;

  const [claims, total] = await Promise.all([
    prisma.claim.findMany({
      where, include: { employee: { select: { name: true, department: true } } },
      orderBy: { createdAt: "desc" }, skip, take: limit,
    }),
    prisma.claim.count({ where }),
  ]);

  return NextResponse.json({
    data: claims.map((c) => ({
      id: c.id, employeeName: c.employee.name, department: c.employee.department,
      type: c.type, amount: c.amount, description: c.description, receiptUrl: c.receiptUrl,
      status: c.status, createdAt: c.createdAt.toISOString(),
    })),
    pagination: paginate(page, limit, total),
  });
}
