"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import Link from "next/link";
import {
  BookOpen,
  Star,
  DollarSign,
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MessageSquare,
} from "lucide-react";
import { CalendarView, type CalendarEvent } from "@/components/CalendarView";

interface TrainerStats {
  totalPrograms: number;
  publishedPrograms: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  upcomingBookings: { id: string; programTitle: string; companyName: string; date: string }[];
}

interface AvailabilityDay {
  date: string;
  day: number;
  status: "available" | "booked" | "unavailable";
  label?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

export default function TrainerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<TrainerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Availability state
  const [availDays, setAvailDays] = useState<AvailabilityDay[]>([]);
  const [availMonth, setAvailMonth] = useState(new Date().getMonth());
  const [availYear, setAvailYear] = useState(new Date().getFullYear());
  const [availMonthName, setAvailMonthName] = useState("");
  const [toggling, setToggling] = useState(false);

  function fetchAvailability(m: number, y: number) {
    fetch(`/api/trainer/availability?month=${m}&year=${y}`)
      .then((r) => r.json())
      .then((d) => {
        setAvailDays(d.days || []);
        setAvailMonthName(d.monthName || "");
      })
      .catch(console.error);
  }

  useEffect(() => {
    async function fetchAll() {
      try {
        const [statsRes, calRes] = await Promise.all([
          fetch("/api/trainer/stats"),
          fetch("/api/trainer/calendar"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (calRes.ok) {
          const data = await calRes.json();
          setCalendarEvents(data.bookings || []);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchAll();
    fetchAvailability(availMonth, availYear);
  }, []);

  useEffect(() => {
    fetchAvailability(availMonth, availYear);
  }, [availMonth, availYear]);

  function prevMonth() {
    if (availMonth === 0) { setAvailMonth(11); setAvailYear(availYear - 1); }
    else setAvailMonth(availMonth - 1);
  }
  function nextMonth() {
    if (availMonth === 11) { setAvailMonth(0); setAvailYear(availYear + 1); }
    else setAvailMonth(availMonth + 1);
  }

  async function toggleDay(date: string, currentStatus: string) {
    if (currentStatus === "booked") return; // can't toggle booked days
    setToggling(true);
    const newStatus = currentStatus === "unavailable" ? "AVAILABLE" : "UNAVAILABLE";
    const res = await fetch("/api/trainer/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, status: newStatus }),
    });
    if (res.ok) {
      setAvailDays((prev) =>
        prev.map((d) =>
          d.date === date
            ? { ...d, status: newStatus === "AVAILABLE" ? "available" : "unavailable", label: newStatus === "AVAILABLE" ? undefined : "Unavailable" }
            : d
        )
      );
      toast(newStatus === "UNAVAILABLE" ? "Marked as unavailable" : "Marked as available", "success");
    } else {
      toast("Failed to update availability", "error");
    }
    setToggling(false);
  }

  // Build calendar grid rows
  const firstDayOfMonth = new Date(availYear, availMonth, 1);
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(availYear, availMonth + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const weeks: (AvailabilityDay | null)[][] = [];
  let dayIdx = 0;
  for (let row = 0; dayIdx < daysInMonth; row++) {
    const week: (AvailabilityDay | null)[] = [];
    for (let col = 0; col < 7; col++) {
      if (row === 0 && col < startDayOfWeek) {
        week.push(null);
      } else if (dayIdx >= daysInMonth) {
        week.push(null);
      } else {
        week.push(availDays[dayIdx] || null);
        dayIdx++;
      }
    }
    weeks.push(week);
  }

  if (loading) return <TrainerDashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-muted-foreground">Trainer dashboard</p>
        </div>
        <Link
          href="/trainer/programs/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Program
        </Link>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar"><Calendar className="mr-1 h-4 w-4" />Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Programs</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.publishedPrograms ?? "—"}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalPrograms ?? 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Total bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageRating ? `${stats.averageRating.toFixed(1)}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Average rating</p>
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
            <p className="text-xs text-muted-foreground">Total earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Availability Calendar */}
      <CollapsibleSection title="📅 My Availability" subtitle={`${availMonthName} ${availYear}`} badge={availDays.filter(d => d.status === "booked").length > 0 ? `${availDays.filter(d => d.status === "booked").length} booked` : undefined} defaultOpen={true}>
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between px-0 pt-0">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={prevMonth}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="w-36 text-center text-sm font-semibold">
                {availMonthName} {availYear}
              </span>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={nextMonth}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr>
                    {WEEKDAYS_SHORT.map((d) => (
                      <th key={d} className="border border-border bg-muted/50 px-1 py-2 text-center text-[10px] font-medium text-muted-foreground uppercase w-[14.28%]">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week, wi) => (
                    <tr key={wi}>
                      {week.map((day, di) => {
                        if (!day) return <td key={di} className="border border-border bg-muted/20 p-1 h-[54px] w-[14.28%]" />;
                        const isToday = day.date === today;
                        const isBooked = day.status === "booked";
                        const isUnavailable = day.status === "unavailable";

                        return (
                          <td key={di} className="border border-border bg-card p-1 h-[54px] w-[14.28%]">
                            <button
                              onClick={() => toggleDay(day.date, day.status)}
                              disabled={toggling || isBooked}
                              title={day.label || day.status}
                              className={`w-full h-full rounded-md text-[11px] font-medium transition-colors flex flex-col items-center justify-center gap-0.5
                                ${isBooked
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-default"
                                  : isUnavailable
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                                  : "hover:bg-accent text-foreground/70 hover:text-foreground"
                                }
                                ${isToday ? "ring-2 ring-primary ring-inset" : ""}
                              `}
                            >
                              <span className={isToday ? "font-bold" : ""}>{day.day}</span>
                              {isBooked && <span className="text-[8px] leading-none opacity-70">Busy</span>}
                              {isUnavailable && <span className="text-[8px] leading-none opacity-70">Off</span>}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-border bg-card" /> Available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-blue-100 dark:bg-blue-900/30" /> Booked
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-red-100 dark:bg-red-900/30" /> Unavailable
              </span>
              <span className="text-muted-foreground/60">Click a day to toggle availability</span>
            </div>
          </CardContent>
        </Card>
      </CollapsibleSection>

      {/* Upcoming bookings */}
      <CollapsibleSection title="📋 Upcoming Programs" subtitle={stats?.upcomingBookings?.length ? `${stats.upcomingBookings.length} upcoming` : "None"} defaultOpen={true}>
        <Card className="border-0 shadow-none">
          <CardContent className="px-0 pb-0">
            {stats?.upcomingBookings && stats.upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{b.programTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.companyName} • {new Date(b.date).toLocaleDateString("en-MY")}
                      </p>
                    </div>
                    <Badge variant="outline">Upcoming</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No upcoming bookings.{" "}
                <Link href="/trainer/programs" className="text-primary hover:underline">
                  Manage your programs
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </CollapsibleSection>

      {/* Quick Links */}
      <CollapsibleSection title="🔗 Quick Links" defaultOpen={false}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "My Programs", href: "/trainer/programs", icon: GraduationCap },
            { label: "Messages", href: "/trainer/messages", icon: MessageSquare },
            { label: "Bookings", href: "/trainer/bookings", icon: Calendar },
            { label: "Earnings", href: "/trainer/earnings", icon: DollarSign },
          ].map((action) => (
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

function TrainerDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {/* Actions banner skeleton */}
      <Skeleton className="h-14 w-full rounded-xl" />

      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Availability skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-7 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[260px] w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Upcoming skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick links skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-3 py-4">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
