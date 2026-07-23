import { Suspense } from "react";
import { TrainerDashboardClient } from "@/components/TrainerDashboardClient";
import { Skeleton } from "@/components/ui/skeleton";
import { GET as getStats } from "@/app/api/trainer/stats/route";
import { GET as getActions } from "@/app/api/trainer/actions/route";
import { GET as getEvals } from "@/app/api/trainer/evaluations/route";
import { GET as getAvail } from "@/app/api/trainer/availability/route";
import { NextRequest } from "next/server";

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

function TrainerDashboardSkeleton() {
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

async function TrainerDashboardDataFetcher() {
  const now = new Date();
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const url = `${baseUrl}/api/trainer/availability?month=${now.getMonth()}&year=${now.getFullYear()}`;
  
  const stats = await safeFetch(() => getStats(), { upcomingClasses: 0, completedClasses: 0, averageRating: 0, pendingActions: 0 });
  const actData = await safeFetch(() => getActions(), { actions: [], summary: {} });
  const evals = await safeFetch(() => getEvals(), { evaluations: [], summary: {} });
  const availData = await safeFetch(() => getAvail(new NextRequest(url)), { isAvailable: false });

  return (
    <TrainerDashboardClient 
      initialData={{ stats, actData, evals, availData }} 
    />
  );
}

export default function TrainerDashboardPage() {
  return (
    <Suspense fallback={<TrainerDashboardSkeleton />}>
      <TrainerDashboardDataFetcher />
    </Suspense>
  );
}