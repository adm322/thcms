import { HRDashboardClient } from "@/components/HRDashboardClient";
import { GET as getStats } from "@/app/api/hr/stats/route";
import { GET as getCalendar } from "@/app/api/hr/calendar/route";
import { GET as getFeatured } from "@/app/api/hr/featured/route";
import { GET as getAiRecs } from "@/app/api/ai/recommend/route";
import { GET as getActions } from "@/app/api/hr/actions/route";
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

export default async function HRDashboardPage() {
  const stats = await safeFetch(() => getStats(), { 
    employeesCount: 0, activeBookingsCount: 0, pendingClaimsCount: 0, completionRate: 0,
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
