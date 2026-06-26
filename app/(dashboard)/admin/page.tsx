import { AdminDashboardClient } from "@/components/AdminDashboardClient";
import {
  getAdminStats,
  getAdminCalendar,
  getAdminChangelog,
  getAdminTrainingPlans,
  getAdminActions,
} from "@/lib/services/admin.service";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const currentYear = new Date().getFullYear();

  // ponytail: execute queries sequentially to prevent database connection spikes
  // since we don't have PgBouncer running on this specific cluster.
  const stats = await getAdminStats().catch((e) => { console.error("Failed to load admin stats:", e); return { totalBookings: 0, totalTrainers: 0, totalPrograms: 0, totalRevenue: 0, pendingBookings: 0, pendingReimbursements: 0 }; });
  const calData = await getAdminCalendar().catch((e) => { console.error("Failed to load admin calendar:", e); return { bookings: [], upcoming: [], monthlyStats: {} }; });
  const changelog = await getAdminChangelog().catch((e) => { console.error("Failed to load admin changelog:", e); return []; });
  const planData = await getAdminTrainingPlans(currentYear).catch((e) => { console.error("Failed to load training plans:", e); return { items: [], summary: {} }; });
  const actData = await getAdminActions().catch((e) => { console.error("Failed to load admin actions:", e); return { actions: [], summary: {} }; });

  return (
    <AdminDashboardClient 
      initialData={{ stats, calData, changelog, planData, actData }} 
    />
  );
}
