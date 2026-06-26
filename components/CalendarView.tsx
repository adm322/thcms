"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

import { CalendarEvent, CATEGORY_DOT, MONTHS, ViewMode } from "./calendar/types";
import { MonthGrid } from "./calendar/MonthGrid";
import { CompactMonth } from "./calendar/CompactMonth";

export type { CalendarEvent };

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const today = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  
  // For quarter view: which quarter? 0=Q1, 1=Q2, 2=Q3, 3=Q4
  const viewQuarter = Math.floor(viewMonth / 3);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  function goPrevYear() {
    setViewYear(viewYear - 1);
  }

  function goNextYear() {
    setViewYear(viewYear + 1);
  }

  function goPrevQuarter() {
    if (viewMonth < 3) {
      setViewMonth(9);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 3);
    }
  }

  function goNextQuarter() {
    if (viewMonth > 8) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 3);
    }
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
          {viewMode === "quarter" && (
            <>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goPrevQuarter}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="w-32 text-center text-base font-semibold">
                Q{viewQuarter + 1} {viewYear}
              </h3>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goNextQuarter}>
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
              onClick={() => setViewMode("quarter")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                viewMode === "quarter" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Quarter
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
          {(() => {
            const { daysInMonth, startDayOfWeek, eventsByDay, isToday } = buildMonth(viewYear, viewMonth);
            return (
              <MonthGrid
                eventsByDay={eventsByDay}
                daysInMonth={daysInMonth}
                startDayOfWeek={startDayOfWeek}
                isToday={isToday}
                onEventClick={onEventClick}
              />
            );
          })()}
        </div>
      )}

      {/* Quarter view — 1 row of 3 months */}
      {viewMode === "quarter" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((offset) => {
            const month = viewQuarter * 3 + offset;
            const { daysInMonth, startDayOfWeek, eventsByDay, isToday } = buildMonth(viewYear, month);
            return (
              <CompactMonth
                key={month}
                month={month}
                daysInMonth={daysInMonth}
                startDayOfWeek={startDayOfWeek}
                eventsByDay={eventsByDay}
                isToday={isToday}
                setViewMonth={setViewMonth}
                setViewMode={setViewMode}
              />
            );
          })}
        </div>
      )}

      {/* Year view — 4 rows of 3 months */}
      {viewMode === "year" && (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((quarter) => (
            <div key={quarter} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[0, 1, 2].map((offset) => {
                const month = quarter * 3 + offset;
                const { daysInMonth, startDayOfWeek, eventsByDay, isToday } = buildMonth(viewYear, month);
                return (
                  <CompactMonth
                    key={month}
                    month={month}
                    daysInMonth={daysInMonth}
                    startDayOfWeek={startDayOfWeek}
                    eventsByDay={eventsByDay}
                    isToday={isToday}
                    setViewMonth={setViewMonth}
                    setViewMode={setViewMode}
                  />
                );
              })}
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