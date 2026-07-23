import { Suspense } from "react";
import { HRDashboardClient } from "@/components/HRDashboardClient";
import { Skeleton } from "@/components/ui/skeleton";
import { GET as getStats } from "@/app/api/hr/stats/route";
import { GET as getCalendar } from "@/app/api/hr/calendar/route";
import { GET as getFeatured } from "@/app/api/hr/featured/route";
import { GET as getAiRecs } from "@/app/api/ai/recommend/route";
import { GET as getActions } from "@/app/api/hr/actions/route";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// ponytail: resilient fetching — any single failure returns defaults instead of crashing the RSC
async function safeFetch<T>(fn: () => Promise<Response>, fallback: T): Promise<T> {
  try {
    const res = await fn();
    return await res.json();
  } catch {
    return fallback;
  }
}

function HRDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="col-span-4 h-96 rounded-xl" />
        <Skeleton className="col-span-3 h-96 rounded-xl" />
      </div>
    </div>
  );
}

async function HRDashboardDataFetcher() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "HR") redirect("/");

  const stats = await safeFetch(() => getStats(), { 
    employeesCount: 0, activeBookingsCount: 0, completionRate: 0,
    upcomingClasses: 0, alerts: 0, hrdfUsage: 0
  });
  const calData = await safeFetch(() => getCalendar(), { bookings: [], upcoming: [], monthlyStats: {} });
  const featured = await safeFetch(() => getFeatured(), { providers: [], packages: [] });
  const aiRecs = await safeFetch(() => getAiRecs(), { recommendedPrograms: [] });
  const actData = await safeFetch(() => getActions(), { actions: [], summary: {} });

  return (
    <HRDashboardClient 
      initialData={{ stats, calData, featured, aiRecs, actData }} 
    />
  );
}

export default function HRDashboardPage() {
  return (
    <Suspense fallback={<HRDashboardSkeleton />}>
      <HRDashboardDataFetcher />
    </Suspense>
  );
}