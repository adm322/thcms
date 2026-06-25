import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // All invoices and bookings (parallelized for performance)
  const [invoices, allBookings] = await Promise.all([
    prisma.invoice.findMany({
      include: { booking: { select: { program: { select: { category: true } }, company: { select: { name: true } } } } },
      orderBy: { issuedAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { status: { in: ["CONFIRMED", "PENDING", "COMPLETED"] } },
      include: { program: { select: { category: true } } },
    }),
  ]);

  // Realized = PAID invoices
  const realized = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.amount, 0);

  // Unrealized = SENT but not yet PAID
  const unrealized = invoices
    .filter((i) => i.status === "SENT" || i.status === "PENDING")
    .reduce((sum, i) => sum + i.amount, 0);

  // Overdue = SENT past due date
  const overdue = invoices
    .filter((i) => i.status === "SENT" && i.dueDate && new Date(i.dueDate) < now)
    .reduce((sum, i) => sum + i.amount, 0);

  // Monthly revenue (last 12 months)
  const monthlyRevenue: { month: string; realized: number; unrealized: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const monthInvoices = invoices.filter((inv) => {
      const date = new Date(inv.issuedAt);
      return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
    });
    monthlyRevenue.push({
      month: label,
      realized: monthInvoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0),
      unrealized: monthInvoices.filter((i) => i.status !== "PAID").reduce((s, i) => s + i.amount, 0),
    });
  }

  // Current month revenue
  const currentMonthInvoices = invoices.filter((inv) => {
    const d = new Date(inv.issuedAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const currentMonthRevenue = currentMonthInvoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.amount, 0);
  const currentMonthDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const dailyRunRate = daysElapsed > 0 ? currentMonthRevenue / daysElapsed : 0;

  // Forecast: end of month
  const forecastEOM = currentMonthRevenue + dailyRunRate * (currentMonthDays - daysElapsed);

  // Forecast: end of year (remaining months based on 3-month average)
  const recent3Months = monthlyRevenue.slice(-3);
  const avg3MonthRealized = recent3Months.reduce((s, m) => s + m.realized, 0) / 3;
  const remainingMonths = 11 - currentMonth;
  const forecastEOY = realized + avg3MonthRealized * (remainingMonths + 1);

  // Revenue by category
  const categoryRevenue: Record<string, number> = {};
  invoices
    .filter((i) => i.status === "PAID")
    .forEach((i) => {
      const cat = i.booking?.program?.category || "Other";
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + i.amount;
    });

  // Revenue by company (top 5)
  const companyRevenue: Record<string, number> = {};
  invoices
    .filter((i) => i.status === "PAID")
    .forEach((i) => {
      const name = i.booking?.company?.name || "Unknown";
      companyRevenue[name] = (companyRevenue[name] || 0) + i.amount;
    });

  // Payment status breakdown
  const paidCount = invoices.filter((i) => i.status === "PAID").length;
  const sentCount = invoices.filter((i) => i.status === "SENT").length;
  const pendingCount = invoices.filter((i) => i.status === "PENDING").length;
  const overdueCount = invoices.filter((i) => i.status === "SENT" && i.dueDate && new Date(i.dueDate) < now).length;

  // Pending bookings value (confirmed but not yet invoiced)
  const pendingBookingValue = allBookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "PENDING")
    .reduce((s, b) => s + b.totalFee, 0);

  return NextResponse.json({
    realized,
    unrealized,
    overdue,
    pendingBookingValue,
    monthlyRevenue,
    forecastEOM: Math.round(forecastEOM),
    forecastEOY: Math.round(forecastEOY),
    dailyRunRate: Math.round(dailyRunRate),
    categoryRevenue: Object.entries(categoryRevenue)
      .map(([cat, amt]) => ({ category: cat, amount: amt }))
      .sort((a, b) => b.amount - a.amount),
    companyRevenue: Object.entries(companyRevenue)
      .map(([name, amt]) => ({ company: name, amount: amt }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8),
    paymentBreakdown: {
      paid: { count: paidCount, amount: realized },
      sent: { count: sentCount, amount: invoices.filter((i) => i.status === "SENT").reduce((s, i) => s + i.amount, 0) },
      pending: { count: pendingCount, amount: invoices.filter((i) => i.status === "PENDING").reduce((s, i) => s + i.amount, 0) },
      overdue: { count: overdueCount, amount: overdue },
    },
  });
}
