"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/Toast";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import Link from "next/link";
import {
  Plus, Star, DollarSign, Calendar, ChevronDown, ChevronUp, AlertTriangle,
  Clock, FileText, Users, ArrowRight, MessageSquare, CheckCircle2,
} from "lucide-react";

interface TrainerStats {
  totalPrograms: number;
  publishedPrograms: number;
  draftPrograms: number;
  totalBookings: number;
  bookingStatusCounts: { PENDING: number; CONFIRMED: number; COMPLETED: number; CANCELLED: number };
  totalRevenue: number;
  averageRating: number;
  upcomingBookings: { id: string; programTitle: string; companyName: string; date: string }[];
}

interface ActionItem {
  type: string;
  urgency: "critical" | "urgent" | "soon" | "info";
  message: string;
  action: string | null;
  link: string | null;
  bookingId?: string;
  programTitle?: string;
  programDate?: string;
  daysUntil?: number;
  daysSinceCompletion?: number;
  deadlineDays?: number;
}

interface ReviewItem {
  id: string;
  title: string;
  programTitle: string;
  companyName: string;
  summaryScore: number;
  completedAt: string | null;
}

const URGENCY_COLORS: Record<string, string> = {
  critical: "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20",
  urgent: "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20",
  soon: "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20",
  info: "border-gray-200 dark:border-gray-700",
};

const URGENCY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  urgent: "bg-amber-500",
  soon: "bg-blue-500",
  info: "bg-gray-400",
};

export function TrainerDashboardClient({ initialData }: { initialData: any }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const stats = initialData.stats;
  const actions: any[] = initialData.actData?.actions || [];
  const reviews: any[] = (initialData.evals || []).slice(0, 3);

  const [now] = useState(() => Date.now());

  const [availDays, setAvailDays] = useState<{ date: string; day: number; status: string; label?: string }[]>(
    initialData.availData?.days?.filter((day: any) => day.date >= new Date().toISOString().slice(0, 10)).slice(0, 14) || []
  );
  const [showAvail, setShowAvail] = useState(false);

  function fetchAvailability() {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    fetch(`/api/trainer/availability?month=${m}&year=${y}`)
      .then(r => r.json())
      .then(d => {
        const today = new Date().toISOString().slice(0, 10);
        const days = (d.days || []).filter((day: any) => day.date >= today).slice(0, 14);
        setAvailDays(days);
      })
      .catch(console.error);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" });
  }

  function formatDay(iso: string) {
    return new Date(iso).getDate();
  }

  function formatWeekday(iso: string) {
    return new Date(iso).toLocaleDateString("en-MY", { weekday: "short" });
  }

  const pipelineStages = [
    { label: "Drafts", count: stats?.draftPrograms ?? 0, href: "/trainer/programs", icon: "📝", color: "border-l-gray-400" },
    { label: "Published", count: stats?.publishedPrograms ?? 0, href: "/trainer/programs", icon: "🚀", color: "border-l-blue-500" },
    { label: "Confirmed", count: stats?.bookingStatusCounts?.CONFIRMED ?? 0, href: "/trainer/bookings", icon: "📅", color: "border-l-amber-500" },
    { label: "Completed", count: stats?.bookingStatusCounts?.COMPLETED ?? 0, href: "/trainer/bookings", icon: "✅", color: "border-l-emerald-500" },
  ];

  const upcoming = stats?.upcomingBookings || [];
  const urgencyOrder: Record<string, number> = { critical: 0, urgent: 1, soon: 2, info: 3 };
  const sortedActions = [...actions].sort((a, b) => (urgencyOrder[a.urgency] ?? 4) - (urgencyOrder[b.urgency] ?? 4));

  return (
    <div className="space-y-6 section-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground text-sm">Trainer dashboard</p>
        </div>
        <Link
          href="/trainer/programs/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Program
        </Link>
      </div>

      {/* ─── PIPELINE BAR ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {pipelineStages.map((stage, i) => (
          <Link key={stage.label} href={stage.href}
            className={`rounded-xl border-l-4 ${stage.color} border border-border bg-card p-4 hover:shadow-sm transition-shadow stagger-item`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{stage.label}</p>
              <span className="text-lg">{stage.icon}</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stage.count}</p>
          </Link>
        ))}
      </div>

      {/* ─── MAIN CONTENT (2-col) ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Actions + Upcoming */}
        <div className="lg:col-span-2 space-y-6">
          {/* Actions */}
          <Card>
            <div className="px-5 py-3 flex items-center gap-2 border-b">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold">Needs Attention</h2>
              {sortedActions.length === 0 && (
                <Badge variant="outline" className="text-[10px] ml-auto border-emerald-200 text-emerald-600">All clear</Badge>
              )}
            </div>
            <CardContent className="p-0">
              {sortedActions.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground text-center">
                  <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
                  Nothing needs your attention right now. Great job!
                </p>
              ) : (
                <div className="divide-y">
                  {sortedActions.slice(0, 4).map((a: any, i: number) => (
                    <div key={i} className={`px-5 py-3 ${URGENCY_COLORS[a.urgency] || ""}`}>
                      <div className="flex items-start gap-3">
                        <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${URGENCY_DOT[a.urgency]}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{a.message}</p>
                          {a.action && a.link && (
                            <Link href={a.link} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-1">
                              {a.action} <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card>
            <div className="px-5 py-3 flex items-center gap-2 border-b">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Upcoming Sessions</h2>
              <Badge variant="secondary" className="text-[10px] ml-auto">{upcoming.length} confirmed</Badge>
            </div>
            <CardContent className="p-0">
              {upcoming.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground text-center">
                  No upcoming sessions.{" "}
                  <Link href="/trainer/programs" className="text-primary hover:underline">Promote your programs</Link> to get booked.
                </p>
              ) : (
                <div className="divide-y">
                  {upcoming.map((b: any, i: number) => {
                    const date = new Date(b.date);
                    const daysUntil = Math.ceil((date.getTime() - now) / 86400000);
                    return (
                      <Link key={b.id} href={`/trainer/bookings/${b.id}`}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className="text-center flex-shrink-0 w-12">
                          <p className="text-lg font-bold leading-none">{date.getDate()}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            {date.toLocaleDateString("en-MY", { month: "short" })}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{b.programTitle}</p>
                          <p className="text-xs text-muted-foreground">{b.companyName}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {daysUntil <= 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Stats + Reviews + Quick links */}
        <div className="space-y-6">
          {/* Compact Stats */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.averageRating ? stats.averageRating.toFixed(1) : "—"}</p>
                  <p className="text-xs text-muted-foreground">Average Rating</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats ? `RM ${stats.totalRevenue.toLocaleString()}` : "—"}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalBookings ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card>
            <div className="px-5 py-3 flex items-center gap-2 border-b">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Recent Evaluations</h2>
            </div>
            <CardContent className="p-0">
              {reviews.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground text-center">No evaluations yet.</p>
              ) : (
                <div className="divide-y">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="px-5 py-3 space-y-1">
                      <p className="text-sm font-medium truncate">{r.programTitle}</p>
                      <p className="text-xs text-muted-foreground">{r.companyName}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} className={`h-3 w-3 ${n <= Math.round(r.summaryScore) ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-600"}`} />
                          ))}
                        </div>
                        <span className="text-xs font-medium">{r.summaryScore?.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick nav */}
          <Card>
            <CardContent className="p-3 space-y-1">
              {[
                { label: "My Programs", href: "/trainer/programs", icon: "📚" },
                { label: "All Bookings", href: "/trainer/bookings", icon: "📋" },
                { label: "SOP & Guide", href: "/trainer/sop", icon: "📖" },
                { label: "Earnings", href: "/trainer/earnings", icon: "💰" },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── AVAILABILITY (collapsed) ─── */}
      <CollapsibleSection
        title={<span className="flex items-center gap-2"><Clock className="h-4 w-4" />Availability</span>}
        subtitle="Next 14 days"
        defaultOpen={false}
      >
        <Card className="border-0 shadow-none">
          <CardContent className="px-0 pb-0">
            {availDays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No availability data. Check your availability settings.</p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {availDays.map((d: any) => {
                  const isBooked = d.status === "booked";
                  const isUnavailable = d.status === "unavailable";
                  return (
                    <div key={d.date}
                      className={`flex-shrink-0 w-14 rounded-lg border p-2 text-center
                        ${isBooked ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" :
                          isUnavailable ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" :
                          "bg-card border-border"}`}
                    >
                      <p className="text-[10px] text-muted-foreground uppercase">{formatWeekday(d.date)}</p>
                      <p className="text-sm font-bold">{formatDay(d.date)}</p>
                      <span className={`text-[8px] font-medium
                        ${isBooked ? "text-blue-600 dark:text-blue-400" :
                          isUnavailable ? "text-red-600 dark:text-red-400" :
                          "text-emerald-600 dark:text-emerald-400"}`}
                      >
                        {isBooked ? "Busy" : isUnavailable ? "Off" : "Free"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-emerald-400" /> Available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-blue-400" /> Booked
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-red-400" /> Unavailable
              </span>
              <Link href="/trainer" className="text-primary hover:underline ml-auto text-xs">
                Manage availability →
              </Link>
            </div>
          </CardContent>
        </Card>
      </CollapsibleSection>
    </div>
  );
}

export function TrainerDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {/* Pipeline skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
