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

  // Run all 5 queries in parallel — service functions have their own error handling
  const [stats, calData, changelog, planData, actData] = await Promise.all([
    getAdminStats(),
    getAdminCalendar(),
    getAdminChangelog(),
    getAdminTrainingPlans(currentYear),
    getAdminActions(),
  ]);

  return (
    <AdminDashboardClient
      initialData={{ stats, calData, changelog, planData, actData }}
    />
  );
}
