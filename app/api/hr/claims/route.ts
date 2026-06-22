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
  const limit = Math.min(10000, parseInt(searchParams.get("limit") || "50"));
  const status = searchParams.get("status");
  const skip = (page - 1) * limit;

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
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
