"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

export interface CalendarEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  status: string;
  companyName: string;
  trainerName: string;
  trainerId?: string;
  locationType: string;
  durationHours?: number;
  trainerEmail?: string;
  companyAddress?: string | null;
  companyState?: string | null;
  depositPaid?: number;
  depositStatus?: string;
  participantCount?: number;
  totalFee?: number;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

const CATEGORY_DOT: Record<string, string> = {
  Leadership: "#3b82f6",
  Technical: "#10b981",
  "Soft Skills": "#8b5cf6",
  Compliance: "#f59e0b",
  "Team Building": "#f43f5e",
  "HR Operations": "#06b6d4",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ViewMode = "month" | "year";

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const today = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  // For quarter view: which quarter? 0=Q1, 1=Q2, 2=Q3, 3=Q4
  const viewQuarter = Math.floor(viewMonth / 3);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else { setViewMonth(viewMonth - 1); }
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else { setViewMonth(viewMonth + 1); }
  }
  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }
  function goPrevYear() { setViewYear(viewYear - 1); }
  function goNextYear() { setViewYear(viewYear + 1); }
  function goPrevQuarter() {
    if (viewMonth < 3) { setViewMonth(9); setViewYear(viewYear - 1); }
    else { setViewMonth(viewMonth - 3); }
  }
  function goNextQuarter() {
    if (viewMonth > 8) { setViewMonth(0); setViewYear(viewYear + 1); }
    else { setViewMonth(viewMonth + 3); }
  }

  // Build a single month's calendar data
  function buildMonth(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;

    const eventsByDay: Record<number, CalendarEvent[]> = {};
    events.forEach((e) => {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        (eventsByDay[day] ??= []).push(e);
      }
    });

    const isToday = (day: number) =>
      today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

    return { daysInMonth, startDayOfWeek, eventsByDay, isToday };
  }

  // ─── Month Header with navigation ────────────────────────
  function renderMonthNav(year: number, month: number, onPrev: () => void, onNext: () => void, label: string) {
    return (
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={onPrev}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <h4 className="w-36 text-center text-sm font-semibold">{label}</h4>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={onNext}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── Render full month grid ──────────────────────────────
  function renderMonthGrid(year: number, month: number, compact = false) {
    const { daysInMonth, startDayOfWeek, eventsByDay, isToday } = buildMonth(year, month);
    const cellHeight = compact ? "h-[70px]" : "h-[100px]";
    const textSize = compact ? "text-[9px]" : "text-[10px]";

    const weeks: (number | null)[][] = [];
    let currentDay = 1;
    for (let row = 0; currentDay <= daysInMonth; row++) {
      const week: (number | null)[] = [];
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < startDayOfWeek) {
          week.push(null);
        } else if (currentDay > daysInMonth) {
          week.push(null);
        } else {
          week.push(currentDay++);
        }
      }
      weeks.push(week);
    }

    return (
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>
            {WEEKDAYS.map((d) => (
              <th key={d} className="border border-border bg-muted/50 px-1 py-1.5 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-[14.28%]">
                {compact ? d.charAt(0) : d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => (
                <td
                  key={di}
                  className={cn(
                    "border border-border align-top p-1", cellHeight, "w-[14.28%]",
                    day ? "bg-card" : "bg-muted/20"
                  )}
                >
                  {day && (
                    <div className="flex flex-col h-full">
                      <span
                        className={cn(
                          "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold mb-0.5 flex-shrink-0",
                          isToday(day)
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground"
                        )}
                      >
                        {day}
                      </span>
                      <div className="flex-1 space-y-0.5 overflow-hidden">
                        {eventsByDay[day]?.slice(0, compact ? 2 : 3).map((event) => (
                          <button
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event);
                            }}
                            title={`${event.title} — ${event.companyName} (${event.trainerName})`}
                            className={cn(
                              "w-full text-left truncate rounded-sm px-1 py-0.5 leading-tight font-medium transition-colors hover:brightness-90",
                              event.status === "COMPLETED" && "opacity-50 line-through",
                              event.status.startsWith("PLANNED_") && "border border-dashed opacity-70 italic",
                              textSize
                            )}
                            style={{
                              backgroundColor: `${CATEGORY_DOT[event.category] || "#6b7280"}${event.status.startsWith("PLANNED_") ? "0a" : "18"}`,
                              color: CATEGORY_DOT[event.category] || "#6b7280",
                              borderLeft: `3px solid ${CATEGORY_DOT[event.category] || "#6b7280"}`,
                            }}
                          >
                            {event.title}
                          </button>
                        ))}
                        {eventsByDay[day] && eventsByDay[day].length > (compact ? 2 : 3) && (
                          <span className={cn("block text-muted-foreground px-1", textSize)}>
                            +{eventsByDay[day].length - (compact ? 2 : 3)} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // ─── Render a compact month card (year view) ─────────────
  function renderCompactMonth(year: number, month: number) {
    const { daysInMonth, startDayOfWeek, eventsByDay, isToday } = buildMonth(year, month);
    const eventCount = Object.values(eventsByDay).reduce((sum, arr) => sum + arr.length, 0);

    const weeks: (number | null)[][] = [];
    let currentDay = 1;
    for (let row = 0; currentDay <= daysInMonth; row++) {
      const week: (number | null)[] = [];
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < startDayOfWeek) {
          week.push(null);
        } else if (currentDay > daysInMonth) {
          week.push(null);
        } else {
          week.push(currentDay++);
        }
      }
      weeks.push(week);
    }

    return (
      <div className="rounded-lg border p-2 bg-card">
        <h5 className="text-xs font-semibold mb-1 text-center">{MONTHS[month]}</h5>
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              {WEEKDAYS.map((d) => (
                <th key={d} className="text-center text-[8px] font-medium text-muted-foreground w-[14.28%] py-0.5">
                  {d.charAt(0)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((day, di) => {
                  if (!day) return <td key={di} className="p-0.5" />;
                  const hasEvents = !!eventsByDay[day]?.length;
                  return (
                    <td key={di} className="p-0.5 text-center">
                      <button
                        onClick={() => {
                          setViewMonth(month);
                          setViewMode("month");
                        }}
                        className={cn(
                          "w-full h-6 rounded text-[9px] font-medium transition-colors",
                          isToday(day)
                            ? "bg-primary text-primary-foreground"
                            : hasEvents
                            ? "bg-accent text-foreground hover:bg-accent/70"
                            : "text-muted-foreground hover:bg-accent/40"
                        )}
                        title={
                          hasEvents
                            ? eventsByDay[day].map(e => e.title).join(", ")
                            : `${MONTHS[month]} ${day}`
                        }
                      >
                        {day}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {eventCount > 0 && (
          <p className="text-[9px] text-muted-foreground text-center mt-1">{eventCount} event{eventCount > 1 ? "s" : ""}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header — view toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          {viewMode === "month" && (
            <>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="w-48 text-center text-base font-semibold">
                {MONTHS[viewMonth]} {viewYear}
              </h3>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          {viewMode === "year" && (
            <>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goPrevYear}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="w-24 text-center text-base font-semibold">{viewYear}</h3>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goNextYear}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View mode pills */}
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                viewMode === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("year")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                viewMode === "year" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Year
            </button>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={goToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Month view */}
      {viewMode === "month" && (
        <div className="overflow-x-auto">
          {renderMonthGrid(viewYear, viewMonth)}
        </div>
      )}

      {/* Year view — 4 rows of 3 months */}
      {viewMode === "year" && (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((quarter) => (
            <div key={quarter} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[0, 1, 2].map((offset) => renderCompactMonth(viewYear, quarter * 3 + offset))}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(CATEGORY_DOT).map(([cat, color]) => (
          <span key={cat} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}