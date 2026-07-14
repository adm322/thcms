import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-guards";
import { LeaveStatusSchema } from "@/lib/validations";

export const PATCH = withAuth(
  { role: "HR", companyId: true },
  async ({ session, request, params }) => {
    const { id } = params as { id: string };

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = LeaveStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Valid status required: APPROVED, REJECTED, CANCELLED" },
        { status: 400 }
      );
    }

    // Multi-tenant guard: only the owning company can update this leave
    const existing = await prisma.leave.findFirst({
      where: { id, employee: { companyId: session.companyId ?? "" } },
      include: { employee: { select: { name: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const leave = await prisma.leave.update({
      where: { id },
      data: { status: parsed.data.status, approvedById: session.id },
      include: { employee: { select: { name: true } } },
    });

    return NextResponse.json(leave);
  }
);
