import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const [bookings, pendingBookings] = await Promise.all([
    prisma.booking.findMany({
      where: { companyId: session.companyId, status: { in: ["CONFIRMED", "COMPLETED"] } },
      include: { program: { select: { title: true, category: true } } },
      orderBy: { programDate: "desc" },
      take: 10,
    }),
    prisma.booking.count({ where: { companyId: session.companyId, status: "PENDING" } }),
  ]);

  const actions: any[] = [];

  // 1. HRDF claims not submitted for completed trainings
  for (const b of bookings) {
    const daysSince = Math.floor((now.getTime() - b.programDate.getTime()) / 86400000);
    const deadlineDays = 180 - daysSince; // 6 months = ~180 days

    if (b.status === "COMPLETED" && !b.employerHrdfSubmitted && daysSince > 0) {
      const urgency = deadlineDays <= 7 ? "critical" : deadlineDays <= 30 ? "urgent" : deadlineDays <= 90 ? "soon" : "info";
      actions.push({
        type: "hrdf_claim",
        urgency,
        bookingId: b.id,
        programTitle: b.program.title,
        programDate: b.programDate.toISOString(),
        daysSinceCompletion: daysSince,
        deadlineDays,
        message: urgency === "critical"
          ? `URGENT: Only ${deadlineDays} days left to submit HRDF claim for "${b.program.title}" — deadline approaching!`
          : urgency === "urgent"
          ? `HRDF claim window closing: ${deadlineDays} days remaining for "${b.program.title}"`
          : urgency === "soon"
          ? `HRDF claim due for "${b.program.title}" — ${deadlineDays} days remaining`
          : `You can still claim HRDF for "${b.program.title}" — completed ${daysSince} days ago`,
        action: "Submit HRDF Claim",
        link: `/hr/bookings/${b.id}`,
      });
    }
  }

  // 2. Upcoming trainings to prepare for
  const upcoming = bookings.filter(b => b.status === "CONFIRMED" && new Date(b.programDate) > now);
  for (const b of upcoming.slice(0, 3)) {
    const daysUntil = Math.ceil((new Date(b.programDate).getTime() - now.getTime()) / 86400000);
    actions.push({
      type: "upcoming_training",
      urgency: daysUntil <= 3 ? "urgent" : daysUntil <= 7 ? "soon" : "info",
      bookingId: b.id,
      programTitle: b.program.title,
      programDate: b.programDate.toISOString(),
      daysUntil,
      message: daysUntil <= 3
        ? `"${b.program.title}" starts in ${daysUntil} day${daysUntil>1?"s":""}! Final checks needed.`
        : daysUntil <= 7
        ? `"${b.program.title}" is in ${daysUntil} days — complete pre-training checklist`
        : `"${b.program.title}" coming up in ${daysUntil} days`,
      action: "Prepare",
      link: `/hr/bookings/${b.id}`,
    });
  }

  // 3. Pending approvals
  if (pendingBookings > 0) {
    actions.push({
      type: "pending",
      urgency: "info",
      message: `You have ${pendingBookings} booking${pendingBookings>1?"s":""} waiting for admin approval`,
      action: "View Bookings",
      link: "/hr/bookings",
    });
  }

  // 4. Training budget utilization (for Malaysia, companies must spend HRDF levy)
  const totalSpent = bookings
    .filter(b => b.status !== "CANCELLED")
    .reduce((s, b) => s + b.totalFee, 0);
  if (totalSpent > 0) {
    actions.push({
      type: "budget",
      urgency: "info",
      message: `Total training investment: RM ${totalSpent.toLocaleString()} across ${bookings.length} programs`,
      action: null,
      link: null,
    });
  }

  // HRDF deadline reminders — check completed bookings without employer submission
  const completedWithoutHrdf = bookings.filter(
    (b) => b.status === "COMPLETED" && !b.employerHrdfSubmitted
  );
  for (const b of completedWithoutHrdf) {
    const daysSince = Math.floor((now.getTime() - new Date(b.programDate).getTime()) / 86400000);
    const deadlineDays = 180 - daysSince;
    const urgency = deadlineDays <= 30 ? "critical" : deadlineDays <= 90 ? "urgent" : "soon";
    const urgencyLabel = deadlineDays <= 30 ? `⚠️ Only ${deadlineDays}d left!` : deadlineDays <= 90 ? `${deadlineDays}d remaining` : `${daysSince}d since completion`;

    actions.push({
      type: "trainer_hrdf",
      urgency,
      bookingId: b.id,
      programTitle: b.program.title,
      programDate: b.programDate.toISOString(),
      daysSinceCompletion: daysSince,
      deadlineDays,
      message: `${urgencyLabel} Submit HRDF claim for "${b.program.title}" before it expires`,
      action: "Submit Claim",
      link: `/hr/bookings/${b.id}`,
    });
  }

  return NextResponse.json({
    actions: actions.sort((a, b) => {
      const order: Record<string, number> = { critical: 0, urgent: 1, soon: 2, info: 3 };
      return (order[a.urgency] ?? 4) - (order[b.urgency] ?? 4);
    }),
    summary: {
      pendingApprovals: pendingBookings,
      upcomingTrainings: upcoming.length,
      hrdfClaimsDue: actions.filter(a => a.type === "hrdf_claim").length,
      urgentCount: actions.filter(a => a.urgency === "critical" || a.urgency === "urgent").length,
    },
  });
}
