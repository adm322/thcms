import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

// GET — list reviews by this HR user
export async function GET() {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

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

// POST — submit a review for a completed booking
export async function POST(request: NextRequest) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const { bookingId, rating, comment, trainerId } = body as { bookingId: string; rating: number; comment: string; trainerId: string };
  if (!bookingId || !rating || !trainerId) {
    return NextResponse.json({ error: "bookingId, rating, and trainerId are required" }, { status: 400 });
  }

  // Check booking is completed
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.hrId !== session.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Upsert review
  const review = await prisma.review.upsert({
    where: { bookingId },
    update: { rating, comment },
    create: { bookingId, hrId: session.id, trainerId, rating, comment },
  });

  return NextResponse.json(review, { status: 201 });
}
