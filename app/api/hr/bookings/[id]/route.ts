import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "HR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      program: { select: { title: true, category: true, durationHours: true, locationType: true, trainer: { select: { name: true } } } },
      participants: true,
      evaluations: true,
      invoices: true,
    },
  });

  if (!booking || booking.companyId !== session.companyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: booking.id,
    programTitle: booking.program.title,
    programCategory: booking.program.category,
    programDuration: booking.program.durationHours,
    locationType: booking.program.locationType,
    trainerName: booking.program.trainer.name,
    programDate: booking.programDate.toISOString(),
    totalFee: booking.totalFee,
    depositPaid: booking.depositPaid,
    depositStatus: booking.depositStatus,
    status: booking.status,
    hrdfScheme: booking.hrdfScheme,
    employerHrdfSubmitted: booking.employerHrdfSubmitted,
    employerHrdfSubmittedAt: booking.employerHrdfSubmittedAt?.toISOString() || null,
    trainerHrdfSubmitted: booking.trainerHrdfSubmitted,
    trainerHrdfSubmittedAt: booking.trainerHrdfSubmittedAt?.toISOString() || null,
    trainerDocumentsUrl: booking.trainerDocumentsUrl,
    venuePreference: booking.venuePreference,
    venueAddress: booking.venueAddress,
    venueConfirmed: booking.venueConfirmed,
    participants: booking.participants,
    evaluations: booking.evaluations,
    invoices: booking.invoices,
  });
}
