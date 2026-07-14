import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { companyId: session.companyId },
    include: {
      program: { select: { title: true, category: true, locationType: true, trainer: { select: { name: true } } } },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    bookings.map((b) => ({
      id: b.id,
      programTitle: b.program.title,
      category: b.program.category,
      trainerName: b.program.trainer.name,
      programDate: b.programDate.toISOString(),
      totalFee: b.totalFee,
      depositPaid: b.depositPaid,
      depositStatus: b.depositStatus,
      status: b.status,
      participantCount: b._count.participants,
      venueAddress: b.venueAddress || b.program.locationType.toUpperCase(),
      createdAt: b.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { programId, participantCount, programDate, venuePreference, venueAddress, meetingLink } = body || {};

  if (!programId || !participantCount || !programDate) {
    return NextResponse.json({ error: "programId, participantCount, and programDate are required" }, { status: 400 });
  }

  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program || program.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Program not available" }, { status: 400 });
  }

  const isHybrid = program.locationType === "hybrid" || venuePreference === "hybrid";
  const isOnline = venuePreference === "online" || (venuePreference === "as_program" && program.locationType === "online");

  if (isHybrid || isOnline) {
    if (!meetingLink || typeof meetingLink !== "string" || (!meetingLink.includes("zoom.us") && !meetingLink.includes("meet.google.com"))) {
      return NextResponse.json({ error: "A valid Zoom or Google Meet link is required for online or hybrid sessions." }, { status: 400 });
    }
  }

  // ponytail: duplicate check — same company, program, and date
  const existing = await prisma.booking.findFirst({
    where: { companyId: session.companyId, programId, programDate: new Date(programDate) },
  });
  if (existing && existing.status !== "CANCELLED") {
    return NextResponse.json({
      error: `You already have ${existing.status === "COMPLETED" ? "a completed" : "an existing"} booking for this program on ${new Date(programDate).toLocaleDateString("en-MY")}. Visit My Bookings to manage it.`,
      existingBookingId: existing.id,
    }, { status: 409 });
  }

  const totalFee = participantCount * program.pricePerPax;

  try {
    const booking = await prisma.booking.create({
      data: {
        programId,
        hrId: session.id,
        companyId: session.companyId,
        programDate: new Date(programDate),
        totalFee,
        depositPaid: 0,
        depositStatus: "UNPAID",
        status: "PENDING",
        venuePreference: venuePreference || "as_program",
        venueAddress: venueAddress || null,
        venueConfirmed: !!(venueAddress),
        meetingLink: (isHybrid || isOnline) ? meetingLink : null,
      },
    });
    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    console.error("Failed to create booking:", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
