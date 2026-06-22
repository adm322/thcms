import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TRAINER" || !session.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [bookings, programs, availabilities] = await Promise.all([
    prisma.booking.findMany({
      where: {
        program: { trainerId: session.id },
        status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
      },
      include: {
        program: { select: { id: true, title: true, category: true } },
        company: { select: { name: true } },
      },
      orderBy: { programDate: "desc" },
    }),
    prisma.program.findMany({
      where: { trainerId: session.id },
      select: { id: true, title: true, category: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.trainerAvailability.findMany({
      where: {
        trainerId: session.id,
        date: { gte: now },
      },
      orderBy: { date: "asc" },
      take: 60,
    }),
  ]);

  const actions: any[] = [];

  // 1. Upcoming bookings this week
  const upcomingThisWeek = bookings.filter(
    (b) => b.status === "CONFIRMED" && new Date(b.programDate) > now && new Date(b.programDate) <= nextWeek
  );
  for (const b of upcomingThisWeek) {
    const daysUntil = Math.ceil((new Date(b.programDate).getTime() - now.getTime()) / 86400000);
    actions.push({
      type: "upcoming_this_week",
      urgency: daysUntil <= 1 ? "critical" : daysUntil <= 3 ? "urgent" : "soon",
      bookingId: b.id,
      programTitle: b.program.title,
      programDate: b.programDate.toISOString(),
      companyName: b.company.name,
      daysUntil,
      message:
        daysUntil <= 1
          ? `⚠️ "${b.program.title}" for ${b.company.name} is TOMORROW! Prepare now.`
          : `"${b.program.title}" for ${b.company.name} in ${daysUntil} days — get materials ready`,
      action: "View Details",
      link: `/trainer/bookings/${b.id}`,
    });
  }

  // 2. Completed trainings — submit trainer HRDF claim
  const completedWithoutHrdf = bookings.filter(
    (b) => b.status === "COMPLETED" && !b.trainerHrdfSubmitted
  );
  for (const b of completedWithoutHrdf.slice(0, 3)) {
    const daysSince = Math.floor(
      (now.getTime() - new Date(b.programDate).getTime()) / 86400000
    );
    const deadlineDays = 180 - daysSince;
    actions.push({
      type: "trainer_hrdf",
      urgency: deadlineDays <= 7 ? "critical" : deadlineDays <= 30 ? "urgent" : "soon",
      bookingId: b.id,
      programTitle: b.program.title,
      programDate: b.programDate.toISOString(),
      daysSinceCompletion: daysSince,
      deadlineDays,
      message:
        deadlineDays <= 7
          ? `⚠️ Only ${deadlineDays}d left to submit your HRDF claim for "${b.program.title}"`
          : deadlineDays <= 30
          ? `Submit trainer HRDF claim for "${b.program.title}" — ${deadlineDays}d remaining`
          : `You can still claim HRDF for "${b.program.title}" — ${daysSince}d since completion`,
      action: "Submit Claim",
      link: `/trainer/bookings/${b.id}`,
    });
  }

  // 3. Unpublished or dormant programs
  const unpublished = programs.filter((p) => p.status !== "PUBLISHED");
  if (unpublished.length > 0) {
    actions.push({
      type: "unpublished",
      urgency: "info",
      message: `You have ${unpublished.length} unpublished program${unpublished.length > 1 ? "s" : ""} — publish to attract bookings`,
      action: "Manage Programs",
      link: "/trainer/programs",
    });
  }

  // 4. Programs with zero bookings
  const programsWithBookings = new Set(
    bookings.map((b) => b.program?.id).filter(Boolean)
  );
  const zeroBookingPrograms = programs.filter(
    (p) => p.status === "PUBLISHED" && !programsWithBookings.has(p.id)
  );
  if (zeroBookingPrograms.length > 0) {
    actions.push({
      type: "zero_bookings",
      urgency: zeroBookingPrograms.length >= 3 ? "soon" : "info",
      message:
        zeroBookingPrograms.length >= 3
          ? `${zeroBookingPrograms.length} published programs have no bookings — consider promoting them`
          : `"${zeroBookingPrograms[0].title}" has no bookings yet — review pricing or description`,
      action: zeroBookingPrograms.length >= 3 ? "View All" : "Edit Program",
      link:
        zeroBookingPrograms.length >= 3
          ? "/trainer/programs"
          : `/trainer/programs/${zeroBookingPrograms[0].id}`,
    });
  }

  // 5. Availability gaps — long periods with no upcoming bookings
  const confirmedBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" && new Date(b.programDate) > now
  );
  if (confirmedBookings.length === 0 && availabilities.length > 0) {
    actions.push({
      type: "availability_gap",
      urgency: "info",
      message: "You have upcoming availability set but no confirmed bookings — make sure your programs are visible",
      action: "Browse Marketplace",
      link: "/trainer/marketplace",
    });
  }

  // 6. Revenue summary
  const totalRevenue = bookings
    .filter((b) => b.status !== "CANCELLED")
    .reduce((s, b) => s + b.totalFee, 0);
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;
  if (completedCount > 0 || totalRevenue > 0) {
    actions.push({
      type: "earnings",
      urgency: "info",
      message: `You've completed ${completedCount} training${completedCount !== 1 ? "s" : ""} with total earnings of RM ${totalRevenue.toLocaleString()}`,
      action: null,
      link: null,
    });
  }

  // 7. Pending booking approvals
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  if (pendingCount > 0) {
    actions.push({
      type: "pending_approval",
      urgency: pendingCount > 2 ? "soon" : "info",
      message: `${pendingCount} booking${pendingCount > 1 ? "s" : ""} awaiting admin approval`,
      action: "View",
      link: "/trainer/bookings",
    });
  }

  return NextResponse.json({
    actions: actions.sort((a, b) => {
      const order: Record<string, number> = {
        critical: 0,
        urgent: 1,
        soon: 2,
        info: 3,
      };
      return (order[a.urgency] ?? 4) - (order[b.urgency] ?? 4);
    }),
    summary: {
      upcomingThisWeek: upcomingThisWeek.length,
      pendingHrdfClaims: completedWithoutHrdf.length,
      unpublishedPrograms: unpublished.length,
      zeroBookingPrograms: zeroBookingPrograms.length,
      pendingApprovals: pendingCount,
      urgentCount: actions.filter(
        (a) => a.urgency === "critical" || a.urgency === "urgent"
      ).length,
    },
  });
}
