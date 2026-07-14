import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
  // H5: Run all 5 queries in parallel instead of sequentially
  const [totalBookings, totalTrainers, totalPrograms, pendingBookings,
         invoices, totalCompanies] = await Promise.all([
    prisma.booking.count(),
    prisma.user.count({ where: { role: "TRAINER" } }),
    prisma.program.count({ where: { status: "PUBLISHED" } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.invoice.findMany({ where: { status: { in: ["PAID", "SENT"] } }, select: { amount: true } }),
    prisma.company.count(),
  ]);

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  return {
    totalBookings,
    totalTrainers,
    totalPrograms,
    totalRevenue,
    pendingBookings,
    totalCompanies,
  };
}

export async function getAdminCalendar(year?: string | null, month?: string | null) {
  const now = new Date();
  const monthStart = month
    ? new Date(Number(month.split("-")[0]), Number(month.split("-")[1]) - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

  // H8: Run date-range query and upcoming query in parallel (2 queries instead of 3 sequential)
  const [bookings, upcomingBookings] = await Promise.all([
    // Main calendar view: bookings in the filtered date range
    (async () => {
      const dateFilter: Record<string, unknown> = {};
      if (month) {
        const [y, m] = month.split("-").map(Number);
        dateFilter.programDate = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
      } else if (year) {
        const y = Number(year);
        dateFilter.programDate = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) };
      }
      return prisma.booking.findMany({
        where: { ...dateFilter, status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] } },
        include: {
          program: { select: { title: true, category: true, locationType: true, durationHours: true, trainer: { select: { id: true, name: true, email: true } } } },
          company: { select: { name: true, address: true, state: true } },
          _count: { select: { participants: true } },
        },
        orderBy: { programDate: "asc" },
      });
    })(),
    // Upcoming: from now, limited to 15
    prisma.booking.findMany({
      where: { programDate: { gte: now }, status: { in: ["CONFIRMED", "PENDING"] } },
      include: {
        program: { select: { title: true, category: true, locationType: true, durationHours: true, trainer: { select: { id: true, name: true, email: true } } } },
        company: { select: { name: true, address: true, state: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { programDate: "asc" },
      take: 15,
    }),
  ]);

  // C2/H8: Derive monthlyStats from bookings result — no extra DB query needed
  // Filter to month window (covers both the case where 'bookings' = date-range and when month param is absent)
  const monthBookings = bookings.filter(b =>
    b.programDate >= monthStart && b.programDate <= monthEnd
  );

  const monthlyStats = {
    totalTrainings: monthBookings.length,
    totalHours: monthBookings.reduce((s, b) => s + b.program.durationHours, 0),
    completedCount: monthBookings.filter((b) => b.status === "COMPLETED").length,
    confirmedCount: monthBookings.filter((b) => b.status === "CONFIRMED").length,
    pendingCount: monthBookings.filter((b) => b.status === "PENDING").length,
    byCategory: monthBookings.reduce<Record<string, number>>((acc, b) => {
      const cat = b.program.category;
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {}),
  };

  return {
    bookings: bookings.map((b) => ({
      id: b.id,
      title: b.program.title,
      category: b.program.category,
      locationType: b.program.locationType,
      durationHours: b.program.durationHours,
      trainerName: b.program.trainer.name,
      trainerId: b.program.trainer.id,
      trainerEmail: b.program.trainer.email,
      companyName: b.company.name,
      companyAddress: b.company.address,
      companyState: b.company.state,
      date: b.programDate.toISOString(),
      status: b.status,
      totalFee: b.totalFee,
      depositPaid: b.depositPaid,
      depositStatus: b.depositStatus,
      participantCount: b._count.participants,
    })),
    upcoming: upcomingBookings.map((b) => ({
      id: b.id,
      title: b.program.title,
      category: b.program.category,
      locationType: b.program.locationType,
      durationHours: b.program.durationHours,
      trainerName: b.program.trainer.name,
      trainerId: b.program.trainer.id,
      trainerEmail: b.program.trainer.email,
      companyName: b.company.name,
      companyAddress: b.company.address,
      companyState: b.company.state,
      date: b.programDate.toISOString(),
      status: b.status,
      totalFee: b.totalFee,
      participantCount: b._count.participants,
    })),
    monthlyStats,
  };
}

export async function getAdminChangelog() {
  const entries = await prisma.changelog.findMany({
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return entries;
}

export async function getAdminTrainingPlans(year: number, companyId?: string) {
  // C4: Only select what the client actually uses — no regNumber, address, state, or bookings array
  const companies = await prisma.company.findMany({
    where: companyId ? { id: companyId } : {},
    select: {
      id: true,
      name: true,
      _count: { select: { employees: true } },
      trainingPlans: {
        where: { targetYear: year },
        select: {
          id: true,
          title: true,
          category: true,
          department: true,
          targetCount: true,
          targetMonth: true,
          estimatedCost: true,
          priority: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          booking: {
            select: {
              id: true,
              programDate: true,
              totalFee: true,
              status: true,
              program: { select: { title: true, category: true, trainer: { select: { name: true } } } },
            },
          },
        },
        orderBy: [{ targetMonth: "asc" }, { priority: "desc" }],
      },
    },
  });

  // H6: Use _sum aggregation instead of loading full booking rows for totalSpent
  const companyIds = companies.map(c => c.id);
  const yearStart = new Date(`${year}-01-01`);
  const yearEnd = new Date(`${year + 1}-01-01`);
  const spendingByCompany = await prisma.booking.groupBy({
    by: ['companyId'],
    where: {
      companyId: { in: companyIds },
      programDate: { gte: yearStart, lt: yearEnd },
      status: { not: "CANCELLED" },
    },
    _sum: { totalFee: true },
  });
  const spendingMap = Object.fromEntries(spendingByCompany.map(r => [r.companyId, r._sum.totalFee ?? 0]));

  const data = companies.map((company) => {
    const plans = company.trainingPlans.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      booking: p.booking
        ? {
            id: p.booking.id,
            programDate: p.booking.programDate.toISOString(),
            totalFee: p.booking.totalFee,
            status: p.booking.status,
            programTitle: p.booking.program.title,
            programCategory: p.booking.program.category,
            trainerName: p.booking.program.trainer.name,
          }
        : null,
    }));

    const totalSpent = spendingMap[company.id] ?? 0;
    const plannedCost = plans.reduce((s, p) => s + p.estimatedCost, 0);
    const completedPlans = plans.filter((p) => p.status === "COMPLETED").length;
    const scheduledPlans = plans.filter((p) => p.status === "SCHEDULED").length;
    const draftPlans = plans.filter((p) => p.status === "DRAFT").length;
    const matchedPlans = plans.filter((p) => p.status === "MATCHED").length;

    const depts: Record<string, { count: number; cost: number }> = {};
    for (const p of plans) {
      const d = p.department || "Unassigned";
      if (!depts[d]) depts[d] = { count: 0, cost: 0 };
      depts[d].count += 1;
      depts[d].cost += p.estimatedCost;
    }

    return {
      companyId: company.id,
      companyName: company.name,
      employeeCount: company._count.employees,
      planCount: plans.length,
      totalSpent,
      plannedCost,
      completedPlans,
      scheduledPlans,
      draftPlans,
      matchedPlans,
      departments: Object.entries(depts).map(([dept, d]) => ({ department: dept, ...d })),
      items: plans,
    };
  });

  return {
    companies: data,
    platformSummary: {
      totalCompanies: data.length,
      totalSpent: data.reduce((s, c) => s + c.totalSpent, 0),
      totalPlanned: data.reduce((s, c) => s + c.plannedCost, 0),
      totalPlanItems: data.reduce((s, c) => s + c.planCount, 0),
      year,
    },
  };
}

export async function getAdminActions() {
  const now = new Date();

  // C1: Added .take(5) — previously loaded entire pending bookings table into memory.
  // Separate count query preserves accurate summary total (take:5 only limits the list).
  const [pendingBookings, totalPendingBookings] = await Promise.all([
    prisma.booking.findMany({
      where: { status: "PENDING" },
      include: { program: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.booking.count({ where: { status: "PENDING" } }),
  ]);

  const recentCompleted = await prisma.booking.findMany({
    where: { status: "COMPLETED", employerHrdfSubmitted: false },
    include: { program: { select: { title: true } } },
    orderBy: { programDate: "desc" },
    take: 10,
  });

  const actions: {
    type?: string | null;
    urgency: string;
    message?: string | null;
    action?: string | null;
    link?: string | null;
    bookingId?: string;
    programTitle?: string;
    pendingDays?: number;
    daysSinceCompletion?: number;
  }[] = [];

  for (const b of pendingBookings) {
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

  return {
    actions: actions.sort((a, b) => {
      const order: Record<string, number> = { critical: 0, urgent: 1, soon: 2, info: 3 };
      return (order[a.urgency] ?? 4) - (order[b.urgency] ?? 4);
    }),
    summary: {
      criticalCount: actions.filter(a => a.urgency === "critical").length,
      urgentCount: actions.filter(a => a.urgency === "urgent").length,
      pendingBookings: totalPendingBookings,
      pendingApprovals: totalPendingBookings,
      hrdfClaimsDue: recentCompleted.length,
    },
  };
}
