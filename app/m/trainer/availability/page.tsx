import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const AVAILABILITY_TONE: Record<string, string> = {
  AVAILABLE:    "bg-emerald-500",
  UNAVAILABLE:  "bg-rose-500",
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function MobileTrainerAvailabilityPage({
  searchParams,
}: { searchParams: Promise<{ month?: string; year?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TRAINER") redirect("/m");

  const { month: monthStr, year: yearStr } = await searchParams;
  const today   = new Date();
  const month   = monthStr != null ? Number(monthStr) : today.getMonth();
  const year    = yearStr  != null ? Number(yearStr)  : today.getFullYear();
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd   = endOfMonth  (new Date(year, month, 1));

  const [avail, bookings] = await Promise.all([
    prisma.trainerAvailability.findMany({
      where: { trainerId: session.id, date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: "asc" },
    }).catch(() => []),
    prisma.booking.findMany({
      where: {
        program: { trainerId: session.id },
        status:  { in: ["PENDING", "CONFIRMED"] },
        programDate: { gte: monthStart, lte: monthEnd },
      },
      select: { id: true, programDate: true },
    }).catch(() => []),
  ]);

  const availByDate = new Map<string, { status: string }>();
  avail.forEach((a) => availByDate.set(ymd(new Date(a.date)), { status: a.status }));
  const bookingsByDate = new Map<string, number>();
  bookings.forEach((b) => {
    const key = ymd(new Date(b.programDate));
    bookingsByDate.set(key, (bookingsByDate.get(key) ?? 0) + 1);
  });

  // Build calendar grid.
  const firstWeekday = monthStart.getDay();      // 0 = Sun
  const daysInMonth  = monthEnd.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = monthStart.toLocaleString("en-GB", { month: "long", year: "numeric" });
  const prevMonth  = month === 0  ? { m: 11, y: year - 1 } : { m: month - 1, y: year };
  const nextMonth  = month === 11 ? { m: 0,  y: year + 1 } : { m: month + 1, y: year };

  const availableCount  = avail.filter((a) => a.status === "AVAILABLE").length;
  const bookedCount     = bookings.length;

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--brand)]">
          Availability
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight">{monthLabel}</h1>
          <div className="text-xs text-muted-foreground tabular-nums">
            {availableCount} open · {bookedCount} booked
          </div>
        </div>
      </header>

      {/* Month nav */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-3">
        <Link
          href={`/m/trainer/availability?month=${prevMonth.m}&year=${prevMonth.y}`}
          className="bg-card border border-border rounded-full px-3 py-1.5 text-xs font-semibold text-center active:scale-95 transition-transform"
        >
          ← Prev
        </Link>
        <div className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground tabular-nums text-center">
          {month + 1} / {year}
        </div>
        <Link
          href={`/m/trainer/availability?month=${nextMonth.m}&year=${nextMonth.y}`}
          className="bg-card border border-border rounded-full px-3 py-1.5 text-xs font-semibold text-center active:scale-95 transition-transform"
        >
          Next →
        </Link>
      </div>

      {/* Calendar card */}
      <section className="bg-card border border-border rounded-2xl p-3 shadow-sm mb-4">
        <div className="grid grid-cols-7 gap-1 text-[10px] uppercase tracking-wide font-bold text-muted-foreground mb-1.5 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} className="aspect-square" />;
            const key      = ymd(d);
            const isToday  = ymd(d) === ymd(today);
            const bookingCount = bookingsByDate.get(key) ?? 0;
            const a        = availByDate.get(key);
            const status   = a?.status;
            return (
              <div
                key={i}
                className={cn(
                  "aspect-square rounded-lg border flex flex-col items-center justify-center text-[11px] font-semibold relative",
                  status ? AVAILABILITY_TONE[status] : "bg-background border-border text-muted-foreground",
                  isToday  && "ring-2 ring-[var(--brand)] ring-offset-1",
                  status === "AVAILABLE"   && "text-white",
                  status === "UNAVAILABLE" && "text-white",
                )}
              >
                <span>{d.getDate()}</span>
                {bookingCount > 0 && (
                  <span className="absolute bottom-0.5 right-0.5 size-4 rounded-full bg-[var(--brand-deep)] text-white text-[9px] grid place-items-center font-bold">
                    {bookingCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-border flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          <Legend className="bg-emerald-500" label="Available" />
          <Legend className="bg-rose-500"   label="Unavailable" />
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-[var(--brand-deep)] text-white text-[9px] grid place-items-center font-bold">N</span>
            Booked
          </span>
        </div>
      </section>

      <p className="text-xs text-muted-foreground leading-relaxed text-center max-w-xs mx-auto">
        Update availability from the desktop calendar — this view reflects the latest changes.
      </p>
    </main>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-3 rounded-full ${className}`} />
      {label}
    </span>
  );
}

