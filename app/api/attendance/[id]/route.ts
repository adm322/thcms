export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Redirect any QR scan directly to the check-in portal
  return NextResponse.redirect(new URL(`/class/${id}/check-in`, _req.url));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { email, icNumber, isSessionAuth } = body;

    let targetEmail = email;
    const targetIc = icNumber;
    let targetUserId: string | null = null;

    if (isSessionAuth) {
      const session = await getSession();
      if (!session || session.role !== "PARTICIPANT") {
        return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
      }
      targetEmail = session.email;
      targetUserId = session.id;
    } else {
      if (!email || !icNumber) {
        return NextResponse.json({ error: "Email and IC Number are required." }, { status: 400 });
      }
    }

    // 1. Fetch Booking Data
    const booking = await prisma.booking.findUnique({
      where: { id: id },
      include: {
        program: { select: { title: true } },
        participants: { select: { id: true, name: true, email: true, icNumber: true, attendanceStatus: true, userId: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: "Training not found." }, { status: 404 });

    // 2. Match Participant
    const participant = booking.participants.find(p => {
      if (isSessionAuth) {
        return p.userId === targetUserId || p.email?.toLowerCase() === targetEmail?.toLowerCase();
      } else {
        return p.email?.toLowerCase() === targetEmail.toLowerCase() && p.icNumber === targetIc;
      }
    });

    if (!participant) {
      if (isSessionAuth) {
        return NextResponse.json({ error: "You are not enrolled in this training." }, { status: 401 });
      } else {
        return NextResponse.json({ error: "No matching registration found for that Email and IC Number." }, { status: 401 });
      }
    }

    // 3. Check if already checked in
    if (participant.attendanceStatus === "PRESENT") {
      return NextResponse.json({ message: "You are already marked as PRESENT." }, { status: 409 });
    }

    // 4. Mark Attendance (and link userId if it was a generic email match)
    const updateData: any = { attendanceStatus: "PRESENT" };
    if (isSessionAuth && !participant.userId && targetUserId) {
      updateData.userId = targetUserId;
    }

    await prisma.participant.update({ 
      where: { id: participant.id }, 
      data: updateData 
    });

    return NextResponse.json({ message: `Welcome, ${participant.name}! You are checked in for ${booking.program.title}.` });
  } catch (error) {
    console.error("Attendance Check-In Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
