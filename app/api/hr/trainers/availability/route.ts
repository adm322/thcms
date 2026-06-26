import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const trainerId = searchParams.get("trainerId");
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth()));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  if (!trainerId) {
    return NextResponse.json({ error: "trainerId required" }, { status: 400 });
  }

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const [bookings, unavailable] = await Promise.all([
    prisma.booking.findMany({
      where: {
        program: { trainerId },
        status: { in: ["CONFIRMED", "PENDING"] },
        programDate: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { programDate: true, program: { select: { title: true } }, company: { select: { name: true } } },
    }),
    prisma.trainerAvailability.findMany({
      where: { trainerId, status: "UNAVAILABLE", date: { gte: startOfMonth, lte: endOfMonth } },
      select: { date: true, reason: true },
    }),
  ]);

  const bookingMap: Record<string, string[]> = {};
  bookings.forEach((b) => {
    const key = b.programDate.toISOString().slice(0, 10);
    (bookingMap[key] ??= []).push(`${b.program.title} — ${b.company.name}`);
  });

  const unavailableSet = new Set(unavailable.map((u) => u.date.toISOString().slice(0, 10)));
  const daysInMonth = endOfMonth.getDate();
  const days: { date: string; day: number; status: "available" | "booked" | "unavailable"; label?: string }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const key = date.toISOString().slice(0, 10);
    let status: "available" | "booked" | "unavailable" = "available";

    if (unavailableSet.has(key)) status = "unavailable";
    else if (bookingMap[key]) status = "booked";

    days.push({ date: key, day: d, status });
  }

  return NextResponse.json({ days, month, year });
}
