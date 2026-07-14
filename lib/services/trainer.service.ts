import { prisma } from "@/lib/prisma";

export async function getTrainerStats(trainerId: string) {
  const [totalPrograms, publishedPrograms, bookings, profile] = await Promise.all([
    prisma.program.count({ where: { trainerId } }),
    prisma.program.count({ where: { trainerId, status: "PUBLISHED" } }),
    prisma.booking.findMany({
      where: { program: { trainerId } },
      include: { program: { select: { title: true } }, company: { select: { name: true } } },
      orderBy: { programDate: "asc" },
    }),
    prisma.trainerProfile.findUnique({ where: { userId: trainerId } }),
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
      participantCount: 0, // resolved below
    }));

  // Resolve participant counts with a single groupBy — avoids N+1
  const upcomingWithPax = upcoming.length > 0
    ? (() => {
        const ids = upcoming.map((b) => b.id);
        return prisma.participant
          .groupBy({
            by: ["bookingId"],
            where: { bookingId: { in: ids }, attendanceStatus: { in: ["PENDING", "PRESENT"] } },
            _count: { id: true },
          })
          .then((counts) => {
            const map = new Map(counts.map((c) => [c.bookingId, c._count.id]));
            return upcoming.map((b) => ({ ...b, participantCount: map.get(b.id) ?? 0 }));
          });
      })()
    : [];

  // Booking status breakdown for pipeline
  const statusCounts = { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 };
  bookings.forEach((b) => {
    if (b.status in statusCounts) statusCounts[b.status as keyof typeof statusCounts]++;
  });

  const resolved = await upcomingWithPax;

  return {
    totalPrograms,
    publishedPrograms,
    draftPrograms: totalPrograms - publishedPrograms,
    totalBookings: bookings.length,
    bookingStatusCounts: statusCounts,
    totalRevenue,
    averageRating: profile?.rating ?? 0,
    totalPax: resolved.reduce((s, b) => s + b.participantCount, 0),
    upcomingBookings: resolved,
  };
}

export async function getTrainerActions(trainerId: string) {
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [bookings, programs, availabilities] = await Promise.all([
    prisma.booking.findMany({
      where: {
        program: { trainerId },
        status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
      },
      include: {
        program: { select: { id: true, title: true, category: true } },
        company: { select: { name: true } },
      },
      orderBy: { programDate: "desc" },
    }),
    prisma.program.findMany({
      where: { trainerId },
      select: { id: true, title: true, category: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.trainerAvailability.findMany({
      where: { trainerId, date: { gte: now } },
      orderBy: { date: "asc" },
      take: 60,
    }),
  ]);

  const actions: {
    type?: string | null;
    urgency: string;
    message?: string | null;
    action?: string | null;
    link?: string | null;
    bookingId?: string;
    programTitle?: string;
    programDate?: string;
    companyName?: string;
    daysUntil?: number;
    daysSinceCompletion?: number;
    deadlineDays?: number;
  }[] = [];

  // 1. Upcoming bookings this week
  const upcomingThisWeek = bookings.filter(
    (b) => b.status === "CONFIRMED" && new Date(b.programDate) > now && new Date(b.programDate) <= nextWeek,
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

  // 2. Completed trainings — trainer uploads supporting docs for employer's e-TRiS submission
  const completedWithoutDocs = bookings.filter(
    (b) => b.status === "COMPLETED" && !b.trainerHrdfSubmitted,
  );
  for (const b of completedWithoutDocs.slice(0, 3)) {
    const daysSince = Math.floor(
      (now.getTime() - new Date(b.programDate).getTime()) / 86400000,
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
          ? `⚠️ Only ${deadlineDays}d left to upload supporting docs for "${b.program.title}"`
          : deadlineDays <= 30
            ? `Upload supporting documents for "${b.program.title}" — ${deadlineDays}d remaining`
            : `Supporting documents still needed for "${b.program.title}" — ${daysSince}d since completion`,
      action: "Upload Docs",
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
    bookings.map((b) => b.program?.id).filter(Boolean),
  );
  const zeroBookingPrograms = programs.filter(
    (p) => p.status === "PUBLISHED" && !programsWithBookings.has(p.id),
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
    (b) => b.status === "CONFIRMED" && new Date(b.programDate) > now,
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

  const urgencyOrder: Record<string, number> = { critical: 0, urgent: 1, soon: 2, info: 3 };

  return {
    actions: actions.sort((a, b) => (urgencyOrder[a.urgency] ?? 4) - (urgencyOrder[b.urgency] ?? 4)),
    summary: {
      upcomingThisWeek: upcomingThisWeek.length,
      pendingDocs: completedWithoutDocs.length,
      unpublishedPrograms: unpublished.length,
      zeroBookingPrograms: zeroBookingPrograms.length,
      pendingApprovals: pendingCount,
      urgentCount: actions.filter((a) => a.urgency === "critical" || a.urgency === "urgent").length,
    },
  };
}
