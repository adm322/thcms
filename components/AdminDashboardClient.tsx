"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarView, type CalendarEvent } from "@/components/CalendarView";
import { UpcomingTrainingList } from "@/components/UpcomingTrainingList";
import { EventDetailDialog } from "@/components/EventDetailDialog";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  ClipboardList,
  Users,
  GraduationCap,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { MobileViewLink } from "@/components/mobile-dashboard/MobileViewLink";

interface DashboardStats {
  totalBookings: number;
  totalTrainers: number;
  totalPrograms: number;
  totalRevenue: number;
  pendingBookings: number;
}

interface MonthlyStats {
  totalTrainings: number;
  totalHours: number;
  completedCount: number;
  confirmedCount: number;
  pendingCount: number;
  byCategory: Record<string, number>;
}

import { useRouter } from "next/navigation";

// H7: Memoized action item — prevents re-render of unchanged items when actions list changes
const ActionItem = React.memo(function ActionItem({ action }: { action: any }) {
  return (
    <div className="px-5 py-3">
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${action.urgency === "critical" ? "bg-red-500" : action.urgency === "urgent" ? "bg-amber-500" : "bg-blue-500"}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm">{action.message}</p>
          {action.action && action.link && (
            <Link href={action.link} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-1">
              {action.action} <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
});

export function AdminDashboardClient({ initialData }: { initialData: any }) {
  const router = useRouter();

  const stats = initialData.stats;
  const monthlyStats = initialData.calData?.monthlyStats || null;
  const changelog: any[] = initialData.changelog || [];
  const actions: any[] = initialData.actData?.actions || [];
  
  const items: any[] = initialData.planData?.companies?.flatMap((c: any) => c.items) || [];
  const planStats = {
    pendingReview: items.filter((i: any) => i.status === "DRAFT" || i.status === "MATCHED").length,
    totalPlans: items.length,
  };

  const months: number[] = [];
  for (let m = 0; m < 12; m++) {
    months.push((initialData.calData?.bookings || []).filter((b: any) => new Date(b.date).getMonth() === m).length);
  }
  const trend = months;

  const [events, setEvents] = useState<CalendarEvent[]>(initialData.calData?.bookings || []);
  const [upcoming, setUpcoming] = useState<CalendarEvent[]>(initialData.calData?.upcoming || []);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setEvents(initialData.calData?.bookings || []);
    setUpcoming(initialData.calData?.upcoming || []);
  }, [initialData.calData]);

  function handleEventClick(event: CalendarEvent) {
    setSelectedEvent(event);
    setDialogOpen(true);
  }

  function handleStatusChange(id: string, newStatus: string) {
    const update = (list: CalendarEvent[]) =>
      list.map((e) => (e.id === id ? { ...e, status: newStatus } : e));
    setEvents(update);
    setUpcoming(update);
    setSelectedEvent(null);
    setDialogOpen(false);
    setTimeout(() => router.refresh(), 500);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview, training calendar & operations</p>
      </div>

      {/* Training Plans pending review widget */}
      {planStats && planStats.pendingReview > 0 && (
        <Link
          href="/admin/training-plans"
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-4 hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-200 text-amber-700">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              {planStats.pendingReview} training plan{planStats.pendingReview > 1 ? "s" : ""} pending review
            </p>
            <p className="text-xs text-amber-600">{planStats.totalPlans} total plan items across all companies — review and approve</p>
          </div>
          <ChevronRight className="h-5 w-5 text-amber-500" />
        </Link>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bookings</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings ?? "—"}</div>
            <p className="text-xs text-muted-foreground">{stats?.pendingBookings ?? 0} pending approval</p>
            {trend.length > 0 && (
              <div className="flex gap-0.5 mt-2 h-8 items-end">
                {trend.slice(-6).map((v, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-primary/20 relative" style={{ height: `${Math.max(4, (v / Math.max(1, Math.max(...trend))) * 100)}%` }}>
                    <div className="absolute inset-0 rounded-sm bg-primary/60" style={{ height: `${Math.max(4, (v / Math.max(1, Math.max(...trend))) * 100)}%` }} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trainers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTrainers ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Active providers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Programs</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPrograms ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Published courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `RM ${stats.totalRevenue.toLocaleString()}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Total platform</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly summary bar */}
      {monthlyStats && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card px-5 py-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {new Date().toLocaleDateString("en-MY", { month: "long", year: "numeric" })}
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{monthlyStats.totalTrainings}</span> trainings
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{monthlyStats.totalHours}</span> total hours
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-medium text-emerald-600">{monthlyStats.confirmedCount}</span> confirmed
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            <span className="font-medium text-amber-600">{monthlyStats.pendingCount}</span> pending
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            <span className="font-medium text-blue-600">{monthlyStats.completedCount}</span> completed
          </span>
        </div>
      )}

      {/* Actions panel */}
      {actions.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <div className="px-5 py-3 flex items-center gap-2 border-b">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold">Needs Attention</h2>
          </div>
          <CardContent className="p-0">
            <div className="divide-y">
              {actions.slice(0, 4).map((a: any) => (
                <ActionItem key={a.bookingId ?? a.type} action={a} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar + Upcoming Tabs */}
      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">📅 Training Calendar</TabsTrigger>
          <TabsTrigger value="upcoming">📋 Upcoming ({upcoming.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <CalendarView events={events} onEventClick={handleEventClick} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <UpcomingTrainingList
            trainings={upcoming}
            onSelect={(t) => handleEventClick(t)}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <CollapsibleSection title="🔗 Quick Links" defaultOpen={false}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "All Bookings", href: "/admin/bookings", icon: ClipboardList },
            { label: "Invoices", href: "/admin/invoices", icon: TrendingUp },
            { label: "Manage Trainers", href: "/admin/trainers", icon: Users },
          ].map((action: any) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardContent className="flex items-center gap-3 py-4">
                  <action.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CollapsibleSection>

      {/* Changelog */}
      {changelog.length > 0 && (
        <CollapsibleSection title="📝 Recent Changes" subtitle={`${changelog.length} updates`} defaultOpen={false}>
          <div className="space-y-3">
            {changelog.slice(0, 5).map((entry: any) => (
              <div key={entry.id} className="flex gap-3 text-sm">
                <div className="flex-shrink-0 mt-0.5">
                  <span className={`inline-flex items-center justify-center h-5 min-w-10 rounded-full text-[10px] font-medium px-1.5 ${
                    entry.type === "FEATURE" ? "bg-emerald-100 text-emerald-700" :
                    entry.type === "FIX" ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>{entry.version}</span>
                </div>
                <div>
                  <p className="font-medium">{entry.title}</p>
                  {entry.details && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{entry.details}</p>}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Event Detail Dialog */}
      <EventDetailDialog
        event={selectedEvent}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onStatusChange={handleStatusChange}
      />
      <MobileViewLink />
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
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

      {/* Monthly summary bar skeleton */}
      <Skeleton className="h-12 w-full rounded-lg" />

      {/* Featured/Recent programs skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-44" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Calendar skeleton */}
      <div className="flex gap-2 mb-2">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Month header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-24" />
          </div>
          {/* Calendar grid */}
          <Skeleton className="h-96 w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Quick actions skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 py-4">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Changelog skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-5 w-10 rounded-full flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}