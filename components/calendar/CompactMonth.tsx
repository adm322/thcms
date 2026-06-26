import { cn } from "@/lib/utils";
import { CalendarEvent, MONTHS, WEEKDAYS, ViewMode } from "./types";

interface CompactMonthProps {
  month: number;
  daysInMonth: number;
  startDayOfWeek: number;
  eventsByDay: Record<number, CalendarEvent[]>;
  isToday: (day: number) => boolean;
  setViewMonth: (month: number) => void;
  setViewMode: (mode: ViewMode) => void;
}

export function CompactMonth({
  month,
  daysInMonth,
  startDayOfWeek,
  eventsByDay,
  isToday,
  setViewMonth,
  setViewMode,
}: CompactMonthProps) {
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

      {/* Desktop view (7 days) */}
      <div className="hidden sm:block">
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
      </div>

      {/* Mobile view (5 days Mon-Fri, borderless cells/buttons) */}
      <div className="block sm:hidden">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              {WEEKDAYS.slice(0, 5).map((d) => (
                <th key={d} className="text-center text-[8px] font-medium text-muted-foreground w-[20%] py-0.5 border-0">
                  {d.charAt(0)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi} className="border-0">
                {week.slice(0, 5).map((day, di) => {
                  if (!day) return <td key={di} className="p-0.5 border-0" />;
                  const hasEvents = !!eventsByDay[day]?.length;
                  return (
                    <td key={di} className="p-0.5 text-center border-0">
                      <button
                        onClick={() => {
                          setViewMonth(month);
                          setViewMode("month");
                        }}
                        className={cn(
                          "w-full h-6 rounded text-[9px] font-medium transition-colors border-0",
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
      </div>

      {eventCount > 0 && (
        <p className="text-[9px] text-muted-foreground text-center mt-1">{eventCount} event{eventCount > 1 ? "s" : ""}</p>
      )}
    </div>
  );
}
