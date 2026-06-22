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

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where,
      include: { employee: { select: { name: true, department: true, position: true } }, approvedBy: { select: { name: true } } },
      orderBy: { startDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.leave.count({ where }),
  ]);

  return NextResponse.json({
    data: leaves.map((l) => ({
      id: l.id,
      employeeName: l.employee.name,
      employeeId: l.employeeId,
      department: l.employee.department,
      position: l.employee.position,
      type: l.type,
      startDate: l.startDate.toISOString(),
      endDate: l.endDate.toISOString(),
      days: l.days,
      status: l.status,
      reason: l.reason,
      approvedByName: l.approvedBy?.name || null,
      createdAt: l.createdAt.toISOString(),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { employeeId, type, startDate, endDate, days, reason } = body;
  if (!employeeId || !type || !startDate || !endDate || !days) {
    return NextResponse.json({ error: "employeeId, type, startDate, endDate, days required" }, { status: 400 });
  }

  const leave = await prisma.leave.create({
    data: {
      employeeId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      days: parseFloat(days),
      reason: reason || null,
      status: "APPROVED",
      approvedById: session.id,
    },
    include: { employee: { select: { name: true, department: true } } },
  });

  return NextResponse.json(leave, { status: 201 });
}
