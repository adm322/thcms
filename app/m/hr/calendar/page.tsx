import { BOOKING_STATUS_TONE as STATUS_TONE } from "@/components/mobile-dashboard/types";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  Calendar, Users, ChevronRight, ArrowLeft,
} from "lucide-react";


export const dynamic = "force-dynamic";

interface DayGroup {
  key:   string;
  label: string;
  isToday: boolean;
  bookings: Array<{
    id: string;
    status: string;
    programDate: Date;
    program: { title: string; trainer: { name: string } };
    participants: { id: string }[];
  }>;
}



export default async function MobileHRCalendarPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "HR") redirect("/m");

  const bookings = await prisma.booking.findMany({
    where: {
      companyId: session.companyId ?? "",
      status:    { in: ["PENDING", "CONFIRMED"] },
      programDate: { gte: new Date() },
    },
    include: {
      program:      { include: { trainer: true } },
      company:      true,
      participants: { select: { id: true } },
    },
    orderBy: { programDate: "asc" },
    take: 30,
  }).catch(() => []);

  if (bookings.length === 0) {
    return (
      <main className="px-4 pt-5 pb-24">
        <header className="mb-4">
          <Link href="/m" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="size-3.5" /> Back
          </Link>
          <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
            HR Calendar
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Upcoming sessions</h1>
        </header>
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Calendar className="mx-auto size-8 text-muted-foreground/60 mb-2" />
          <h2 className="text-sm font-semibold">No upcoming sessions</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            New bookings will show up here as trainers are scheduled.
          </p>
        </div>
      </main>
    );
  }

  // Group by ISO date
  const todayKey = new Date().toISOString().slice(0, 10);
  const dayMap = new Map<string, DayGroup["bookings"]>();
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
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
          HR Calendar
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Upcoming sessions</h1>
          <div className="text-xs text-muted-foreground">{bookings.length} scheduled</div>
        </div>
      </header>

      <div className="space-y-5">
        {groups.map((g) => (
          <section key={g.key}>
            <div className="flex items-baseline gap-2 mb-2">
              <div className="size-9 rounded-xl grid place-items-center shrink-0" style={{ backgroundColor: "var(--brand-soft)", color: "var(--brand-deep)" }}>
                <Calendar className="size-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{g.isToday ? "Today" : g.label.split(",")[0]}</div>
                <div className="text-xs text-muted-foreground">{g.bookings.length} session{g.bookings.length === 1 ? "" : "s"}</div>
              </div>
            </div>
            <ul className="space-y-2">
              {g.bookings.map((b) => {
                const time = new Date(b.programDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                return (
                  <li key={b.id}>
                    <Link
                      href={`/m/hr/bookings/${b.id}`}
                      className="block bg-card border border-border rounded-2xl p-3.5 active:scale-[0.99] transition-transform"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-center w-14 shrink-0">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-bold">{time.split(" ")[0]}</div>
                          <div className="text-[10px] text-muted-foreground">{time.split(" ")[1] ?? ""}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold leading-tight">{b.program.title}</div>
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            Trainer · {b.program.trainer.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_TONE[b.status] ?? "bg-slate-100 text-slate-900"}`}>
                              {b.status}
                            </span>
                            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                              <Users className="size-3" /> {b.participants.length}
                            </span>
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

      <Link
        href="/m/hr/new-booking"
        className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-transform"
        style={{
          backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))",
          boxShadow: "0 14px 30px -10px var(--brand-deep)55",
        }}
      >
        <Calendar className="size-4" />
        New booking request
      </Link>
    </main>
  );
}

