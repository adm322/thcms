import { cn } from "@/lib/utils";
import { CalendarEvent, CATEGORY_DOT, WEEKDAYS } from "./types";

interface MonthGridProps {
  compact?: boolean;
  eventsByDay: Record<number, CalendarEvent[]>;
  daysInMonth: number;
  startDayOfWeek: number;
  isToday: (day: number) => boolean;
  onEventClick?: (event: CalendarEvent) => void;
}

export function MonthGrid({
  compact = false,
  eventsByDay,
  daysInMonth,
  startDayOfWeek,
  isToday,
  onEventClick,
}: MonthGridProps) {
  const cellHeight = compact ? "h-16" : "h-24";
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
    <>
      {/* Desktop View (7-day Table Layout) */}
      <div className="hidden sm:block">
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
      </div>

      {/* Mobile View (Borderless Cards, 5 Days Mon-Fri Layout) */}
      <div className="block sm:hidden">
        <div className="grid grid-cols-5 gap-1 text-center mb-1.5 bg-muted/40 py-1.5 rounded-md px-1">
          {WEEKDAYS.slice(0, 5).map((d) => (
            <span key={d} className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {weeks.flatMap((week) => week.slice(0, 5)).map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-20 bg-muted/5 rounded-md border-0"
                />
              );
            }

            const dayEvents = eventsByDay[day] || [];
            const isCellToday = isToday(day);

            return (
              <div
                key={`day-${day}`}
                className={cn(
                  "min-h-20 bg-card hover:bg-accent/30 rounded-md p-1 flex flex-col justify-between transition-colors border-0",
                  isCellToday && "ring-1 ring-primary/30 bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-4.5 w-4.5 items-center justify-center rounded-full text-[9px] font-bold",
                      isCellToday
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
                    )}
                  >
                    {day}
                  </span>
                </div>

                <div className="flex-1 mt-1 space-y-0.5 overflow-hidden flex flex-col justify-end">
                  {dayEvents.slice(0, 2).map((event) => (
                    <button
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      title={`${event.title} — ${event.companyName} (${event.trainerName})`}
                      className={cn(
                        "w-full text-left truncate rounded-sm px-0.5 py-0.5 leading-none font-semibold transition-colors hover:brightness-90 text-[8px]",
                        event.status === "COMPLETED" && "opacity-50 line-through",
                        event.status.startsWith("PLANNED_") && "border border-dashed opacity-70 italic"
                      )}
                      style={{
                        backgroundColor: `${CATEGORY_DOT[event.category] || "#6b7280"}${event.status.startsWith("PLANNED_") ? "0a" : "18"}`,
                        color: CATEGORY_DOT[event.category] || "#6b7280",
                        borderLeft: `2.5px solid ${CATEGORY_DOT[event.category] || "#6b7280"}`,
                      }}
                    >
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="block text-[7px] text-muted-foreground text-right leading-none">
                      +{dayEvents.length - 2}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
