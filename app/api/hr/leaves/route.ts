import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-guards";
import { z } from "zod";

const CreateLeaveSchema = z.object({
  employeeId: z.string().min(1).max(64),
  type: z.string().min(1).max(50),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  days: z.number().min(0.5).max(365),
  reason: z.string().max(2000).optional(),
});

export const GET = withAuth(
  { role: "HR", companyId: true },
  async ({ session, request }) => {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    const where: { employee: { companyId: string }; status?: string } = {
      employee: { companyId: session.companyId! },
    };
    if (status && status !== "ALL") where.status = status;

    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        include: {
          employee: { select: { name: true, department: true, position: true } },
          approvedBy: { select: { name: true } },
        },
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
);

export const POST = withAuth(
  { role: "HR", companyId: true },
  async ({ session, request }) => {
    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = CreateLeaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "employeeId, type, startDate, endDate, days required" },
        { status: 400 }
      );
    }

    // Multi-tenant guard: the employee must belong to the HR's company
    const employee = await prisma.employee.findFirst({
      where: { id: parsed.data.employeeId, companyId: session.companyId! },
    });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const leave = await prisma.leave.create({
      data: {
        employeeId: parsed.data.employeeId,
        type: parsed.data.type,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        days: parsed.data.days,
        reason: parsed.data.reason ?? null,
        status: "APPROVED",
        approvedById: session.id,
      },
      include: { employee: { select: { name: true, department: true } } },
    });

    return NextResponse.json(leave, { status: 201 });
  }
);
