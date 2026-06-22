import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get last 12 weeks of booking activity
  const now = new Date();
  const twelveWeeksAgo = new Date(now);
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

  const bookings = await prisma.booking.findMany({
    where: {
      program: { trainerId: session.id },
      programDate: { gte: twelveWeeksAgo, lte: now },
    },
    select: { programDate: true },
  });

  // Group by date
  const activityMap: Record<string, number> = {};
  bookings.forEach((b) => {
    const key = b.programDate.toISOString().split("T")[0];
    activityMap[key] = (activityMap[key] || 0) + 1;
  });

  // Build 12-week grid (Mon-Sun)
  const weeks: { date: string; level: number; count: number }[][] = [];
  for (let w = 11; w >= 0; w--) {
    const week: { date: string; level: number; count: number }[] = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (w * 7 + d));
      const key = date.toISOString().split("T")[0];
      const count = activityMap[key] || 0;
      week.push({
        date: key,
        count,
        level: count === 0 ? 0 : Math.min(5, Math.ceil(count)),
      });
    }
    weeks.push(week);
  }

  return NextResponse.json({ weeks });
}
