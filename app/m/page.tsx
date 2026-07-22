/**
 * /m — Mobile dashboard
 *
 * Server component. Resolves the session, then calls the same services
 * each role's desktop dashboard already uses (see app/(dashboard)/{role}/page.tsx).
 * Renders the appropriate mobile variant (Trainer / Admin / HR / Participant).
 *
 * Services (not route handlers) are called directly so the data contract is
 * identical to the API endpoints without fragile cross-module imports.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MobileTrainerDashboard } from "@/components/mobile-dashboard/mobile-trainer";
import { MobileAdminDashboard } from "@/components/mobile-dashboard/mobile-admin";
import { MobileHRDashboard } from "@/components/mobile-dashboard/mobile-hr";
import { MobileParticipantDashboard } from "@/components/mobile-dashboard/mobile-participant";

import { getTrainerStats, getTrainerActions } from "@/lib/services/trainer.service";
import { getHRStats, getHRActions, getAIRecommendations } from "@/lib/services/hr.service";
import {
  getAdminStats,
  getAdminChangelog,
  getAdminTrainingPlans,
  getAdminActions,
} from "@/lib/services/admin.service";
import type { UrgencyAction } from "@/components/mobile-dashboard/types";

export const dynamic = "force-dynamic";

export default async function MobileHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userName = session.name || "there";

  // Unread notification count — direct query, role-agnostic
  const unread = session.id
    ? await prisma.notification
        .count({ where: { userId: session.id, read: false } })
        .catch(() => 0)
    : 0;

  if (session.role === "TRAINER") {
    const [stats, actData] = await Promise.all([
      getTrainerStats(session.id).catch(() => ({
        totalPrograms: 0, publishedPrograms: 0, totalRevenue: 0,
        averageRating: 0, upcomingBookings: [], totalPax: 0,
      })),
      getTrainerActions(session.id).catch(() => ({ actions: [], summary: {} })),
    ]);
    return (
      <MobileTrainerDashboard
        userName={userName}
        unreadNotifications={unread}
        data={{ stats, actData }}
      />
    );
  }

  if (session.role === "HR") {
    const [stats, aiRecs, actData] = await Promise.all([
      getHRStats(session.companyId!).catch(() => ({
        totalEmployees: 0, totalBookings: 0, completedBookings: 0, pendingBookings: 0,
        totalSpent: 0, recentBookings: [], categoryBreakdown: [],
      })),
      getAIRecommendations(session.companyId!).catch(() => ({ recommendedPrograms: [] })),
      getHRActions(session.companyId!).catch(() => ({ actions: [], summary: {} })),
    ]);
    return (
      <MobileHRDashboard
        userName={userName}
        unreadNotifications={unread}
        data={{ stats, aiRecs, actData }}
      />
    );
  }

  if (session.role === "ADMIN") {
    const currentYear = new Date().getFullYear();
    const [stats, changelog, planData, rawActData] = await Promise.all([
      getAdminStats().catch(() => ({})),
      getAdminChangelog().catch(() => []),
      getAdminTrainingPlans(currentYear).catch(() => ({ companies: [] })),
      getAdminActions().catch(() => ({ actions: [] })),
    ]);
    const actData = rawActData as { actions?: UrgencyAction[] } | undefined;
    return (
      <MobileAdminDashboard
        userName={userName}
        unreadNotifications={unread}
        data={{ stats, changelog, planData, actData }}
      />
    );
  }

  if (session.role === "PARTICIPANT") {
    const participations = await prisma.participant
      .findMany({
        where: {
          OR: [{ userId: session.id }, { email: session.email }],
        },
        include: {
          quizResults: true,
          booking: {
            include: {
              program: {
                include: { modules: { include: { quizzes: true } } },
              },
            },
          },
        },
        orderBy: { booking: { programDate: "asc" } },
          take: 100,
          skip: 0
    })
      .catch(() => []);

    const completed = participations.filter((p) => p.attendanceStatus === "PRESENT");
    const totalHours = completed.reduce(
      (sum, p) => sum + (p.booking?.program?.durationHours ?? 0),
      0,
    );
    const quizScores = participations.flatMap((p) => p.quizResults.map((r) => r.score));
    const avgQuizScore =
      quizScores.length > 0
        ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
        : null;
    const certificatesEarned = completed.filter((p) => {
      const quizCount =
        p.booking?.program?.modules?.reduce((acc, m) => acc + m.quizzes.length, 0) ?? 0;
      const takenCount = p.quizResults.length;
      return quizCount === 0 || takenCount === quizCount;
    }).length;
    const upcomingCount = participations.filter((p) => p.attendanceStatus === "PENDING").length;

    const shaped = participations.map((p) => ({
      id: p.id,
      bookingId: p.bookingId,
      attendanceStatus: p.attendanceStatus,
      programTitle: p.booking?.program?.title,
      programDate: p.booking?.programDate,
      programCategory: p.booking?.program?.category,
    }));

    return (
      <MobileParticipantDashboard
        userName={userName}
        unreadNotifications={unread}
        data={{
          participations: shaped,
          stats: {
            totalHours,
            completedCount: completed.length,
            certificatesEarned,
            avgQuizScore,
            upcomingCount,
          },
        }}
      />
    );
  }

  // Unknown role — fall back to desktop
  redirect("/");
}
