import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.trainingPlanItem.findUnique({ where: { id } });
  if (!existing || existing.companyId !== session.companyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const {
    title, category, department, targetCount, targetMonth, targetYear,
    estimatedCost, priority, status, matchedProgramId, bookingId, notes,
  } = body;

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

  try {
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
  } catch (err) {
    console.error("Failed to update training plan item:", err);
    return NextResponse.json({ error: "Failed to update training plan item" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.trainingPlanItem.findUnique({ where: { id } });
  if (!existing || existing.companyId !== session.companyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.trainingPlanItem.delete({ where: { id } });
  } catch (err) {
    console.error("Failed to delete training plan item:", err);
    return NextResponse.json({ error: "Failed to delete training plan item" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
