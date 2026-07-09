import { BOOKING_STATUS_TONE as STATUS_TONE } from "@/components/mobile-dashboard/types";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  Clock, Users, ChevronRight, ArrowLeft, Sparkles,
} from "lucide-react";


export const dynamic = "force-dynamic";



type BookingRow = {
  id: string;
  status: string;
  programDate: Date;
  program: { title: string; durationHours: number | null } | null;
  company: { name: string };
  participants: { id: string; attendanceStatus: string }[];
};

interface DayGroup {
  key: string;
  label: string;
  isToday: boolean;
  bookings: BookingRow[];
}

export default async function MobileTrainerCalendarPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TRAINER") redirect("/m");

  const bookings = await prisma.booking.findMany({
    where: {
      program: { trainerId: session.id },
      status:  { in: ["PENDING", "CONFIRMED"] },
      programDate: { gte: new Date() },
    },
    include: {
      program:      true,
      company:      true,
      participants: { select: { id: true, attendanceStatus: true } },
    },
    orderBy: { programDate: "asc" },
    take: 30,
  }).catch(() => []);

  const totalPax     = bookings.reduce((s, b) => s + b.participants.length, 0);
  const totalRevenue = bookings.reduce((s, b) => s + b.totalFee * 0.85, 0);

  // Group by ISO date
  const todayKey = new Date().toISOString().slice(0, 10);
  const dayMap = new Map<string, BookingRow[]>();
  bookings.forEach((b) => {
    const key = new Date(b.programDate).toISOString().slice(0, 10);
    if (!dayMap.has(key)) dayMap.set(key, []);
    dayMap.get(key)!.push(b);
  });
  const groups: DayGroup[] = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => {
      const d = new Date(key);
      return {
        key,
        label: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
        isToday: key === todayKey,
        bookings: items,
      };
    });

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--brand)]">
          My Schedule
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Upcoming sessions</h1>
      </header>

      <section
        className="rounded-3xl p-5 text-white shadow-[0_14px_30px_-10px_rgba(16,196,108,0.4)] mb-5 relative overflow-hidden"
        style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
      >
        <div className="grid grid-cols-3 gap-2 relative">
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">{bookings.length}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Sessions</div>
          </div>
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">{totalPax}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Pax</div>
          </div>
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">RM{Math.round(totalRevenue).toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Forecast</div>
          </div>
        </div>
      </section>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Sparkles className="mx-auto size-8 text-muted-foreground/60 mb-2" />
          <h2 className="text-sm font-semibold">No upcoming sessions</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            New bookings land here automatically. Keep your availability updated.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.key}>
              <div className="flex items-baseline gap-2 mb-2">
                <div className="text-[11px] uppercase tracking-wide font-bold text-[var(--brand-deep)]">
                  {g.isToday ? "TODAY" : g.label.split(",")[0]}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(g.key).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {g.bookings.length} session{g.bookings.length === 1 ? "" : "s"}
                </div>
              </div>

              <ul className="space-y-2">
                {g.bookings.map((b) => {
                  const time    = new Date(b.programDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                  const pax     = b.participants.length;
                  const present = b.participants.filter((p) => p.attendanceStatus === "PRESENT").length;
                  return (
                    <li key={b.id}>
                      <Link
                        href={`/m/trainer/bookings/${b.id}`}
                        className="block bg-card border border-border rounded-2xl p-3.5 active:scale-[0.99] transition-transform"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-center w-14 shrink-0">
                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-bold">{time.split(" ")[0]}</div>
                            <div className="text-[10px] text-muted-foreground">{time.split(" ")[1] ?? ""}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold leading-tight">{b.program?.title ?? "Session"}</div>
                            <div className="text-xs text-muted-foreground mt-1 truncate">{b.company.name}</div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_TONE[b.status] ?? "bg-slate-100 text-slate-900"}`}>
                                {b.status}
                              </span>
                              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                                <Users className="size-3" />{present}/{pax}
                              </span>
                              {b.program?.durationHours ? (
                                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                                  <Clock className="size-3" />{b.program.durationHours}h
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Link
        href="/m/trainer/programs/new"
        className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-transform"
        style={{
          backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))",
          boxShadow: "0 14px 30px -10px var(--brand-deep)55",
        }}
      >
        New program
      </Link>
    </main>
  );
}

