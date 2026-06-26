import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, program: { trainerId: session.id } },
    include: {
      program: { select: { title: true, category: true, durationHours: true, locationType: true, maxParticipants: true } },
      company: { select: { name: true } },
      participants: {
        select: { id: true, name: true, email: true, attendanceStatus: true },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: booking.id,
    programTitle: booking.program.title,
    programCategory: booking.program.category,
    programDuration: booking.program.durationHours,
    locationType: booking.program.locationType,
    companyName: booking.company.name,
    programDate: booking.programDate.toISOString(),
    status: booking.status,
    meetingLink: booking.meetingLink,
    totalFee: booking.totalFee,
    maxParticipants: booking.program.maxParticipants,
    venuePreference: booking.venuePreference,
    venueAddress: booking.venueAddress,
    venueConfirmed: booking.venueConfirmed,
    trainerHrdfSubmitted: booking.trainerHrdfSubmitted,
    trainerDocumentsUrl: booking.trainerDocumentsUrl,
    participants: booking.participants.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      attendanceStatus: p.attendanceStatus,
    })),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, program: { trainerId: session.id } },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await parseBody(req);
  if (body instanceof NextResponse) return body;
  const data: any = {};
  if (body.trainerDocumentsUrl !== undefined) data.trainerDocumentsUrl = body.trainerDocumentsUrl;
  if (body.trainerHrdfSubmitted !== undefined) {
    data.trainerHrdfSubmitted = body.trainerHrdfSubmitted;
    data.trainerHrdfSubmittedAt = body.trainerHrdfSubmitted ? new Date() : null;
  }

  await prisma.booking.update({ where: { id }, data });

  return NextResponse.json({ success: true });
}
