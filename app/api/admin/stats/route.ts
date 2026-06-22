import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalBookings, totalTrainers, totalPrograms, pendingCount, reimburseCount] =
      await Promise.all([
        prisma.booking.count(),
        prisma.user.count({ where: { role: "TRAINER" } }),
        prisma.program.count({ where: { status: "PUBLISHED" } }),
        prisma.booking.count({ where: { status: "PENDING" } }),
        prisma.reimbursement.count({ where: { status: "PENDING" } }),
      ]);

    // Calculate total revenue from invoices
    const invoices = await prisma.invoice.findMany({
      where: { status: { in: ["PAID", "SENT"] } },
      select: { amount: true },
    });
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);

    return NextResponse.json({
      totalBookings,
      totalTrainers,
      totalPrograms,
      totalRevenue,
      pendingBookings: pendingCount,
      pendingReimbursements: reimburseCount,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 }
    );
  }
}
