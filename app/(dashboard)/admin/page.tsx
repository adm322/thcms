import { Suspense } from "react";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAdminStats,
  getAdminCalendar,
  getAdminChangelog,
  getAdminTrainingPlans,
  getAdminActions,
} from "@/lib/services/admin.service";

export const dynamic = "force-dynamic";

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="col-span-4 h-[400px] rounded-xl" />
        <Skeleton className="col-span-3 h-[400px] rounded-xl" />
      </div>
    </div>
  );
}

async function AdminDashboardDataFetcher() {
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

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboardDataFetcher />
    </Suspense>
  );
}