import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      program: { select: { title: true, durationHours: true, locationType: true, trainer: { select: { name: true } } } },
      company: { select: { name: true, address: true } },
    },
  });

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const date = new Date(booking.programDate);
  const endDate = new Date(date.getTime() + booking.program.durationHours * 3600000);

  const formatICSDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TrainHub Malaysia//EN",
    "BEGIN:VEVENT",
    `DTSTART:${formatICSDate(date)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${booking.program.title}`,
    `DESCRIPTION:Trainer: ${booking.program.trainer.name}\\nCompany: ${booking.company.name}\\nLocation: ${booking.program.locationType}\\n`,
    booking.company.address ? `LOCATION:${booking.company.address}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="training-${id.slice(-6)}.ics"`,
    },
  });
}
