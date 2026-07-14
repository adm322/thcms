"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DayInfo {
  date: string;
  day: number;
  status: "available" | "booked" | "unavailable";
  label?: string;
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}
function endOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0);
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TrainerAvailabilityClient({
  trainerId,
  initialMonth,
  initialYear,
}: {
  trainerId: string;
  initialMonth: number;
  initialYear: number;
}) {
  const router = useRouter();
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [days, setDays] = useState<DayInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDays = useCallback(async (m: number, y: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trainer/availability?month=${m}&year=${y}`);
      const data = await res.json();
      setDays(data.days || []);
    } catch {
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDays(month, year);
  }, [month, year, fetchDays]);

  function toggleDay(date: string, currentStatus: string) {
    // Don't allow toggling booked days
    if (currentStatus === "booked") return;

    const newStatus = currentStatus === "unavailable" ? "AVAILABLE" : "UNAVAILABLE";

    fetch("/api/trainer/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, status: newStatus }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        // Optimistic update
        setDays((prev) =>
          prev.map((d) =>
            d.date === date
              ? { ...d, status: newStatus === "AVAILABLE" ? "available" : "unavailable" }
              : d
          )
        );
      })
      .catch(() => {});
  }

  function navigate(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setMonth(newMonth);
    setYear(newYear);
    router.replace(`/trainer/availability?month=${newMonth}&year=${newYear}`, { scroll: false });
  }

  const monthStart = startOfMonth(year, month);
  const monthEnd = endOfMonth(year, month);
  const monthLabel = monthStart.toLocaleString("en-GB", { month: "long", year: "numeric" });

  const firstWeekday = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const availableCount = days.filter((d) => d.status === "available").length;
  const bookedCount = days.filter((d) => d.status === "booked").length;
  const unavailableCount = days.filter((d) => d.status === "unavailable").length;

  const daysByDate = new Map(days.map((d) => [d.date, d]));

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold w-48 text-center">{monthLabel}</h2>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            {availableCount} available
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            {bookedCount} booked
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500" />
            {unavailableCount} off
          </span>
        </div>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="grid grid-cols-7 gap-2 animate-pulse">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-2">
                {cells.map((d, i) => {
                  if (!d) return <div key={i} className="aspect-square" />;
                  const key = ymd(d);
                  const isToday = key === ymd(today);
                  const info = daysByDate.get(key);
                  const status = info?.status ?? "available";

                  return (
                    <button
                      key={i}
                      onClick={() => toggleDay(key, status)}
                      disabled={status === "booked"}
                      className={cn(
                        "aspect-square rounded-lg border flex flex-col items-center justify-center text-sm font-semibold transition-colors",
                        status === "available" && "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-950/50",
                        status === "booked" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 cursor-default",
                        status === "unavailable" && "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-950/50",
                        isToday && "ring-2 ring-primary ring-offset-1"
                      )}
                      title={info?.label || (status === "available" ? "Click to mark unavailable" : status === "unavailable" ? "Click to mark available" : "Booked")}
                    >
                      <span className="text-base">{d.getDate()}</span>
                      <span className="text-[10px] opacity-70">
                        {status === "available" ? "Free" : status === "booked" ? "Busy" : "Off"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Click any day to toggle your availability. Booked days cannot be changed.
      </p>
    </div>
  );
}
