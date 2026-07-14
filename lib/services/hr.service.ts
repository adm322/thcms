import { prisma } from "@/lib/prisma";
import { getSmartRecommendations } from "@/lib/ai";

export async function getHRStats(companyId: string) {
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

  const recentBookings = bookings.map((b) => ({
    id: b.id,
    programTitle: b.program.title,
    category: b.program.category,
    date: b.programDate.toISOString(),
    status: b.status,
    fee: b.totalFee,
  }));

  const categoryMap: Record<string, number> = {};
  bookings.forEach((b) => {
    const cat = b.program.category;
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  return {
    totalEmployees,
    totalBookings,
    completedBookings,
    pendingBookings,
    totalSpent: totalSpent._sum.amount ?? 0,
    recentBookings,
    categoryBreakdown: Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    })),
  };
}

export async function getHRActions(companyId: string) {
  const now = new Date();

  const [bookings, pendingBookings] = await Promise.all([
    prisma.booking.findMany({
      where: { companyId, status: { in: ["CONFIRMED", "COMPLETED"] } },
      include: { program: { select: { title: true, category: true } } },
      orderBy: { programDate: "desc" },
      take: 10,
    }),
    prisma.booking.count({ where: { companyId, status: "PENDING" } }),
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
    daysSinceCompletion?: number;
    deadlineDays?: number;
    daysUntil?: number;
  }[] = [];

  // 1. HRDF claims not submitted for completed trainings
  for (const b of bookings) {
    const daysSince = Math.floor((now.getTime() - b.programDate.getTime()) / 86400000);
    const deadlineDays = 180 - daysSince;

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
  const upcoming = bookings.filter((b) => b.status === "CONFIRMED" && new Date(b.programDate) > now);
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
        ? `"${b.program.title}" starts in ${daysUntil} day${daysUntil > 1 ? "s" : ""}! Final checks needed.`
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
      message: `You have ${pendingBookings} booking${pendingBookings > 1 ? "s" : ""} waiting for admin approval`,
      action: "View Bookings",
      link: "/hr/bookings",
    });
  }

  // 4. Training budget utilization
  const totalSpent = bookings
    .filter((b) => b.status !== "CANCELLED")
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

  // HRDF deadline reminders
  const completedWithoutHrdf = bookings.filter(
    (b) => b.status === "COMPLETED" && !b.employerHrdfSubmitted,
  );
  for (const b of completedWithoutHrdf) {
    const daysSince = Math.floor((now.getTime() - new Date(b.programDate).getTime()) / 86400000);
    const deadlineDays = 180 - daysSince;
    const urgency = deadlineDays <= 30 ? "critical" : deadlineDays <= 90 ? "urgent" : "soon";
    const urgencyLabel = deadlineDays <= 30
      ? `⚠️ Only ${deadlineDays}d left!`
      : deadlineDays <= 90
        ? `${deadlineDays}d remaining`
        : `${daysSince}d since completion`;

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

  const urgencyOrder: Record<string, number> = { critical: 0, urgent: 1, soon: 2, info: 3 };

  return {
    actions: actions.sort((a, b) => (urgencyOrder[a.urgency] ?? 4) - (urgencyOrder[b.urgency] ?? 4)),
    summary: {
      pendingApprovals: pendingBookings,
      upcomingTrainings: upcoming.length,
      hrdfClaimsDue: actions.filter((a) => a.type === "hrdf_claim").length,
      urgentCount: actions.filter((a) => a.urgency === "critical" || a.urgency === "urgent").length,
    },
  };
}

export async function getAIRecommendations(companyId: string) {
  // Get past booking categories
  const bookings = await prisma.booking.findMany({
    where: { companyId },
    include: { program: { select: { category: true } } },
  });
  const pastCategories = [...new Set(bookings.map((b) => b.program.category))];

  // Get employee stats
  const employees = await prisma.employee.findMany({
    where: { companyId },
    select: { department: true },
  });
  const deptMap: Record<string, number> = {};
  employees.forEach((e) => {
    deptMap[e.department || "Other"] = (deptMap[e.department || "Other"] || 0) + 1;
  });
  const departmentBreakdown = Object.entries(deptMap).map(([department, count]) => ({ department, count }));

  // Get AI category recommendations
  const recommendations = await getSmartRecommendations(pastCategories, employees.length, departmentBreakdown);

  // Resolve recommended categories → actual published programs
  const recommendedPrograms = await prisma.program.findMany({
    where: {
      status: "PUBLISHED",
      category: { in: recommendations },
    },
    select: {
      id: true,
      title: true,
      category: true,
      trainer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return {
    recommendations,
    pastCategories,
    employeeCount: employees.length,
    recommendedPrograms,
  };
}
