import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-guards";
import { z } from "zod";

const ReviewSchema = z.object({
  bookingId: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  trainerId: z.string().min(1).max(64),
});

// GET — list reviews by this HR user
export const GET = withAuth(
  { role: "HR", companyId: true },
  async ({ session }) => {
    const reviews = await prisma.review.findMany({
      where: { hrId: session.id },
      include: {
        trainer: { include: { user: { select: { name: true } } } },
        booking: { include: { program: { select: { title: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      reviews.map((r) => ({
        id: r.id,
        trainerName: r.trainer.user.name,
        programTitle: r.booking.program.title,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  }
);

// POST — submit a review for a completed booking
export const POST = withAuth(
  { role: "HR", companyId: true },
  async ({ session, request }) => {
    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "bookingId, rating, and trainerId are required" },
        { status: 400 }
      );
    }

    const { bookingId, rating, comment, trainerId } = parsed.data;

    // Multi-tenant guard: the booking must belong to the HR's company
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, companyId: session.companyId! },
    });
    if (!booking || booking.hrId !== session.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const review = await prisma.review.upsert({
      where: { bookingId },
      update: { rating, comment: comment ?? null },
      create: { bookingId, hrId: session.id, trainerId, rating, comment: comment ?? null },
    });

    return NextResponse.json(review, { status: 201 });
  }
);
