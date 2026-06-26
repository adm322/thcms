import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody, parsePagination, paginate } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams, 10000);
  const status = searchParams.get("status");

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
    pagination: paginate(page, limit, total),
  });
}

export async function POST(request: NextRequest) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const { employeeId, type, startDate, endDate, days, reason } = body as Record<string, string>;
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
