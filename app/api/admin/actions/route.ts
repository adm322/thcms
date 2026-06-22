import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const [pendingBookings, recentCompleted, pendingReimbursements] = await Promise.all([
    prisma.booking.findMany({
      where: { status: "PENDING" },
      include: { program: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { status: "COMPLETED", employerHrdfSubmitted: false },
      include: { program: { select: { title: true } } },
      orderBy: { programDate: "desc" },
      take: 10,
    }),
    prisma.reimbursement.count({ where: { status: "PENDING" } }),
  ]);

  const actions: any[] = [];

  // 1. Pending booking approvals
  for (const b of pendingBookings.slice(0, 5)) {
    const pendingDays = Math.floor((now.getTime() - b.createdAt.getTime()) / 86400000);
    actions.push({
      type: "approval",
      urgency: pendingDays > 3 ? "urgent" : pendingDays > 1 ? "soon" : "info",
      bookingId: b.id,
      programTitle: b.program.title,
      pendingDays,
      message: pendingDays > 3
        ? `⚠️ "${b.program.title}" has been pending approval for ${pendingDays} days — review now`
        : pendingDays > 1
        ? `"${b.program.title}" awaiting approval — ${pendingDays} days pending`
        : `New booking: "${b.program.title}" needs your review`,
      action: "Review & Approve",
      link: `/admin/bookings/${b.id}`,
    });
  }

  // 2. Completed trainings without HRDF submission
  for (const b of recentCompleted.slice(0, 3)) {
    const daysSince = Math.floor((now.getTime() - b.programDate.getTime()) / 86400000);
    actions.push({
      type: "hrdf_followup",
      urgency: daysSince > 30 ? "urgent" : "soon",
      bookingId: b.id,
      programTitle: b.program.title,
      daysSinceCompletion: daysSince,
      message: daysSince > 30
        ? `"${b.program.title}" — ${daysSince}d since completion, no HRDF claim submitted`
        : `"${b.program.title}" completed ${daysSince}d ago — check HRDF readiness`,
      action: "Remind HR",
      link: `/api/admin/remind-hrdf`,
    });
  }

  // 3. Pending reimbursements
  if (pendingReimbursements > 0) {
    actions.push({
      type: "reimbursement",
      urgency: pendingReimbursements > 3 ? "urgent" : "soon",
      message: `${pendingReimbursements} reimbursement${pendingReimbursements>1?"s":""} waiting for approval`,
      action: "Review",
      link: "/admin/reimbursements",
    });
  }

  return NextResponse.json({
    actions: actions.sort((a, b) => {
      const order: Record<string, number> = { urgent: 0, soon: 1, info: 2 };
      return (order[a.urgency] ?? 3) - (order[b.urgency] ?? 3);
    }),
    summary: {
      pendingBookings: pendingBookings.length,
      completedNoHrdf: recentCompleted.length,
      pendingReimbursements,
      urgentCount: actions.filter(a => a.urgency === "urgent").length,
    },
  });
}
