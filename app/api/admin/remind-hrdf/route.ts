import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;

  let body: { bookingId?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { bookingId } = body;
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { program: { select: { title: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  try {
    await prisma.notification.create({
      data: {
        userId: booking.hrId,
        type: "HRDF_DEADLINE",
        title: `⏰ HRDF Claim Reminder: ${booking.program.title}`,
        body: `Admin reminds you to submit the HRDF claim for "${booking.program.title}" — completed ${Math.floor((Date.now() - new Date(booking.programDate).getTime()) / 86400000)} days ago. Submit before it expires.`,
        link: `/hr/bookings/${booking.id}`,
      },
    });
  } catch (err) {
    console.error("Failed to create HRDF reminder notification:", err);
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 });
  }

  return NextResponse.json({ success: true, reminded: true });
}
