import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;

  try {
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company" }, { status: 400 });
    }

    const [
      totalEmployees,
      totalBookings,
      completedBookings,
      pendingBookings,
      totalSpent,
      bookings,
    ] = await Promise.all([
      prisma.employee.count({ where: { companyId } }),
      prisma.booking.count({ where: { companyId } }),
      prisma.booking.count({ where: { companyId, status: "COMPLETED" } }),
      prisma.booking.count({ where: { companyId, status: { in: ["PENDING", "CONFIRMED"] } } }),
      prisma.invoice.aggregate({
        where: { companyId, status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.booking.findMany({
        where: { companyId },
        include: { program: { select: { title: true, category: true } } },
        orderBy: { programDate: "desc" },
        take: 10,
      }),
    ]);

    // Recent bookings
    const recentBookings = bookings.map((b) => ({
      id: b.id,
      programTitle: b.program.title,
      category: b.program.category,
      date: b.programDate.toISOString(),
      status: b.status,
      fee: b.totalFee,
    }));

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    bookings.forEach((b) => {
      const cat = b.program.category;
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    return NextResponse.json({
      totalEmployees,
      totalBookings,
      completedBookings,
      pendingBookings,
      totalSpent: totalSpent._sum.amount ?? 0,
      recentBookings,
      categoryBreakdown: Object.entries(categoryMap).map(([cat, count]) => ({
        category: cat,
        count,
      })),
    });
  } catch (error) {
    console.error("HR stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
