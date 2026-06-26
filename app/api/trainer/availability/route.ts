import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

// GET: Return monthly availability grid with status for each day
export async function GET(request: NextRequest) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth()));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  // Get confirmed bookings for this trainer in the month
  const bookings = await prisma.booking.findMany({
    where: {
      program: { trainerId: session.id },
      status: { in: ["CONFIRMED", "PENDING"] },
      programDate: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { programDate: true, program: { select: { title: true } }, company: { select: { name: true } } },
  });

  // Get trainer's unavailable dates
  const unavailable = await prisma.trainerAvailability.findMany({
    where: {
      trainerId: session.id,
      status: "UNAVAILABLE",
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { date: true, reason: true },
  });

  // Build day-by-day grid
  const daysInMonth = endOfMonth.getDate();
  const days: { date: string; day: number; status: "available" | "booked" | "unavailable"; label?: string }[] = [];

  const bookingMap: Record<string, string[]> = {};
  bookings.forEach((b) => {
    const key = b.programDate.toISOString().slice(0, 10);
    (bookingMap[key] ??= []).push(`${b.program.title} — ${b.company.name}`);
  });

  const unavailableSet = new Set(unavailable.map((u) => u.date.toISOString().slice(0, 10)));
  const unavailableReasons: Record<string, string> = {};
  unavailable.forEach((u) => {
    unavailableReasons[u.date.toISOString().slice(0, 10)] = u.reason || "Unavailable";
  });

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const key = date.toISOString().slice(0, 10);
    const isToday = new Date().toISOString().slice(0, 10) === key;
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

    let status: "available" | "booked" | "unavailable" = "available";
    let label: string | undefined;

    if (unavailableSet.has(key)) {
      status = "unavailable";
      label = unavailableReasons[key];
    } else if (bookingMap[key]) {
      status = "booked";
      label = bookingMap[key].join(" | ");
    } else if (isPast && !isToday) {
      status = "available"; // past dates without bookings are just available
    }

    days.push({ date: key, day: d, status, label });
  }

  return NextResponse.json({ days, month, year, monthName: startOfMonth.toLocaleDateString("en-MY", { month: "long" }) });
}

// PUT: Toggle availability for specific dates
export async function PUT(request: NextRequest) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const { date, status, reason } = body as Record<string, string>;
  if (!date || !status) {
    return NextResponse.json({ error: "date and status required" }, { status: 400 });
  }

  const dateObj = new Date(date);

  if (status === "AVAILABLE") {
    // Remove any existing unavailability record
    await prisma.trainerAvailability.deleteMany({
      where: { trainerId: session.id, date: dateObj },
    });
    return NextResponse.json({ date, status: "AVAILABLE" });
  }

  // Upsert unavailable record
  const record = await prisma.trainerAvailability.upsert({
    where: { trainerId_date: { trainerId: session.id, date: dateObj } },
    update: { status, reason: reason || null },
    create: { trainerId: session.id, date: dateObj, status, reason: reason || null },
  });

  return NextResponse.json({ id: record.id, date: record.date.toISOString(), status: record.status, reason: record.reason });
}
