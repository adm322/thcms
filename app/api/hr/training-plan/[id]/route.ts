import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.trainingPlanItem.findUnique({ where: { id } });
  if (!existing || existing.companyId !== session.companyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const {
    title, category, department, targetCount, targetMonth, targetYear,
    estimatedCost, priority, status, matchedProgramId, bookingId, notes,
  } = body as {
    title?: string; category?: string; department?: string; targetCount?: number; targetMonth?: number; targetYear?: number;
    estimatedCost?: number; priority?: string; status?: string; matchedProgramId?: string | null; bookingId?: string; notes?: string | null;
  };

  // If converting to SCHEDULED via one-click book, verify the booking exists and belongs to same company
  if (status === "SCHEDULED" && bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.companyId !== session.companyId) {
      return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
    }
  }

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (category !== undefined) data.category = category;
  if (department !== undefined) data.department = department;
  if (targetCount !== undefined) data.targetCount = targetCount;
  if (targetMonth !== undefined) data.targetMonth = targetMonth;
  if (targetYear !== undefined) data.targetYear = targetYear;
  if (estimatedCost !== undefined) data.estimatedCost = estimatedCost;
  if (priority !== undefined) data.priority = priority;
  if (status !== undefined) data.status = status;
  if (matchedProgramId !== undefined) data.matchedProgramId = matchedProgramId;
  if (bookingId !== undefined) data.bookingId = bookingId;
  if (notes !== undefined) data.notes = notes;

  const updated = await prisma.trainingPlanItem.update({
    where: { id },
    data,
    include: {
      booking: {
        select: {
          id: true,
          programDate: true,
          totalFee: true,
          status: true,
          program: { select: { title: true, category: true, trainer: { select: { name: true } } } },
        },
      },
    },
  });

  return NextResponse.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    booking: updated.booking
      ? {
          id: updated.booking.id,
          programDate: updated.booking.programDate.toISOString(),
          totalFee: updated.booking.totalFee,
          status: updated.booking.status,
          programTitle: updated.booking.program.title,
          programCategory: updated.booking.program.category,
          trainerName: updated.booking.program.trainer.name,
        }
      : null,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const existing = await prisma.trainingPlanItem.findUnique({ where: { id } });
  if (!existing || existing.companyId !== session.companyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.trainingPlanItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
