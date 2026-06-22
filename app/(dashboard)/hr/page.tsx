"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarView, type CalendarEvent } from "@/components/CalendarView";
import { FeaturedBanner } from "@/components/FeaturedBanner";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import {
  Users,
  ClipboardList,
  DollarSign,
  TrendingUp,
  GraduationCap,
  Star,
  Compass,
} from "lucide-react";

interface HRStats {
  totalEmployees: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalSpent: number;
  recentBookings: {
    id: string;
    programTitle: string;
    category: string;
    date: string;
    status: string;
    fee: number;
  }[];
  categoryBreakdown: { category: string; count: number }[];
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

export default function HRDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<HRStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [aiRecs, setAiRecs] = useState<{ recommendations: string[]; employeeCount: number; pastCategories: string[] } | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [statsRes, calRes, featRes, recRes] = await Promise.all([
          fetch("/api/hr/stats"),
          fetch("/api/hr/calendar"),
          fetch("/api/hr/featured"),
          fetch("/api/ai/recommend"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (calRes.ok) { const data = await calRes.json(); setCalendarEvents(data.bookings || []); }
        if (featRes.ok) setFeatured(await featRes.json());
        if (recRes.ok) setAiRecs(await recRes.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchAll();
  }, []);

  if (loading) return <HRDashboardSkeleton />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">HR Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}. Manage your training and development.
        </p>
      </div>

      {/* Featured Programs Banner */}
      <FeaturedBanner programs={featured} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">📅 Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEmployees ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Active workforce</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bookings</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings ?? "—"}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingBookings ?? 0} pending, {stats?.completedBookings ?? 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Training Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `RM ${stats.totalSpent.toLocaleString()}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Total investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.categoryBreakdown?.length ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Training categories</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent bookings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Bookings</CardTitle>
            <Link href="/hr/bookings" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.recentBookings && stats.recentBookings.length > 0 ? (
              <div className="space-y-2">
                {stats.recentBookings.slice(0, 6).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.programTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(b.date).toLocaleDateString("en-MY")} • RM {b.fee.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={statusVariant[b.status] || "secondary"} className="ml-2 flex-shrink-0">
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No bookings yet.</p>
                <Link
                  href="/hr/marketplace"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Compass className="h-4 w-4" />
                  Browse training programs
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        {aiRecs && aiRecs.recommendations && aiRecs.recommendations.length > 0 && (
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/40 to-transparent dark:from-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                AI Recommendations
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Based on {aiRecs.employeeCount} employees • {aiRecs.pastCategories.length} categories trained
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {aiRecs.recommendations.map((rec) => (
                <Link
                  key={rec}
                  href={`/hr/marketplace?category=${encodeURIComponent(rec)}`}
                  className="flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  {rec}
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick actions & Category breakdown */}
        <CollapsibleSection title="⚡ Quick Actions & Insights" defaultOpen={false}>
          <div className="space-y-3">
            {[
              { label: "Browse Programs", href: "/hr/marketplace", icon: Compass },
              { label: "Upload Employees", href: "/hr/employees/upload", icon: Users },
              { label: "View Evaluations", href: "/hr/evaluations", icon: Star },
              { label: "Plan Training", href: "/hr/training-planner", icon: GraduationCap },
            ].map((action) => (
              <Link key={action.href} href={action.href}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-accent transition-colors">
                <action.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
            {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Categories</p>
                <div className="space-y-1.5">
                  {stats.categoryBreakdown.map((cat: any) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <span className="text-sm">{cat.category}</span>
                      <Badge variant="secondary">{cat.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>

        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <CalendarView events={calendarEvents} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HRDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Featured banner skeleton */}
      <Skeleton className="h-48 w-full rounded-xl" />

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent bookings skeleton */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-14" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right column skeletons */}
        <div className="space-y-6">
          {/* AI recs skeleton */}
          <Card>
            <CardHeader className="pb-2 space-y-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-full" />
              ))}
            </CardContent>
          </Card>

          {/* Quick actions skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}