import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — list reviews by this HR user
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "HR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const session = await getSession();
  if (!session || session.role !== "HR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { bookingId, rating, comment, trainerId } = body;
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
