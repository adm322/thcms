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
      program: { select: { title: true, category: true, trainer: { select: { name: true } } } },
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

  const { programId, participantCount, programDate, venuePreference, venueAddress } = body || {};

  if (!programId || !participantCount || !programDate) {
    return NextResponse.json({ error: "programId, participantCount, and programDate are required" }, { status: 400 });
  }

  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program || program.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Program not available" }, { status: 400 });
  }

  const totalFee = participantCount * program.pricePerPax;

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
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
