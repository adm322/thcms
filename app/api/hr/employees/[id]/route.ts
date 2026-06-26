import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const emp = await prisma.employee.findUnique({
    where: { id },
    include: { _count: { select: { participants: true, leaves: true, attendances: true } } },
  });
  if (!emp || emp.companyId !== session.companyId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...emp, participantCount: emp._count.participants, leaveCount: emp._count.leaves });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const emp = await prisma.employee.findUnique({ where: { id } });
  if (!emp || emp.companyId !== session.companyId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const updated = await prisma.employee.update({
    where: { id },
    data: {
      name: body.name ?? emp.name,
      email: body.email ?? emp.email,
      phone: body.phone ?? emp.phone,
      department: body.department ?? emp.department,
      position: body.position ?? emp.position,
      icNumber: body.icNumber ?? emp.icNumber,
      employmentType: body.employmentType ?? emp.employmentType,
      status: body.status ?? emp.status,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const emp = await prisma.employee.findUnique({ where: { id } });
  if (!emp || emp.companyId !== session.companyId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.employee.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
