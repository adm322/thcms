import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [totalPrograms, publishedPrograms, bookings, profile] = await Promise.all([
      prisma.program.count({ where: { trainerId: session.id } }),
      prisma.program.count({ where: { trainerId: session.id, status: "PUBLISHED" } }),
      prisma.booking.findMany({
        where: { program: { trainerId: session.id } },
        include: { program: { select: { title: true } }, company: { select: { name: true } } },
        orderBy: { programDate: "asc" },
      }),
      prisma.trainerProfile.findUnique({ where: { userId: session.id } }),
    ]);

    // Revenue from invoices linked to trainer's bookings
    const bookingIds = bookings.map((b) => b.id);
    const invoices = await prisma.invoice.findMany({
      where: { bookingId: { in: bookingIds }, status: { in: ["PAID", "SENT"] } },
      select: { amount: true },
    });
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);

    const upcoming = bookings
      .filter((b) => new Date(b.programDate) >= new Date() && b.status === "CONFIRMED")
      .slice(0, 5)
      .map((b) => ({
        id: b.id,
        programTitle: b.program.title,
        companyName: b.company.name,
        date: b.programDate.toISOString(),
      }));

    return NextResponse.json({
      totalPrograms,
      publishedPrograms,
      totalBookings: bookings.length,
      totalRevenue,
      averageRating: profile?.rating ?? 0,
      upcomingBookings: upcoming,
    });
  } catch (error) {
    console.error("Trainer stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
