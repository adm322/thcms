import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ATTENDANCE_TONE as STATUS_TONE } from "@/components/mobile-dashboard/types";
import {
  Calendar, ArrowLeft, BookOpen,
  Sparkles, ChevronRight, Trophy,
} from "lucide-react";


export const dynamic = "force-dynamic";

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}



export default async function MobileParticipantClassesPage({
  searchParams,
}: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "PARTICIPANT") redirect("/m");

  const { tab = "upcoming" } = await searchParams;

  const participations = await prisma.participant.findMany({
    where: {
      OR: [{ userId: session.id }, { email: session.email }],
    },
    include: {
      quizResults: { select: { id: true, score: true } },
      booking: {
        include: {
          program: { include: { modules: { select: { id: true } } } },
          company: { select: { name: true } },
        },
      },
    },
    orderBy: { booking: { programDate: "asc" } },
  }).catch(() => []);

  const now     = new Date();
  const upcoming = participations.filter((p) => p.attendanceStatus === "PENDING" && p.booking && new Date(p.booking.programDate) >= now);
  const past    = participations.filter((p) => p.attendanceStatus === "PRESENT" || (p.booking && new Date(p.booking.programDate) < now));
  const missed  = participations.filter((p) => p.attendanceStatus === "ABSENT");

  const shown = tab === "past" ? past : tab === "missed" ? missed : upcoming;

  // Aggregate stats.
  const hoursCompleted = past.reduce((s, p) => s + (p.booking?.program.durationHours ?? 0), 0);
  const certsEarned    = past.filter((p) => {
    const quizCount = p.booking?.program.modules.length ?? 0;
    return quizCount === 0 || p.quizResults.length >= quizCount;
  }).length;
  const scores          = participations.flatMap((p) => p.quizResults.map((q) => q.score));
  const avgScore        = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
          My Learning
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Classes</h1>
      </header>

      {/* Stats strip — brand blue */}
      <section
        className="rounded-3xl p-5 text-white mb-5 relative overflow-hidden shadow-[0_14px_30px_-10px_rgba(14,165,233,0.4)]"
        style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
      >
        <div className="grid grid-cols-3 gap-2 relative">
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">{hoursCompleted}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Hours</div>
          </div>
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">{certsEarned}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Certs</div>
          </div>
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">{avgScore}<span className="text-xs opacity-85">%</span></div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Avg quiz</div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none -mx-4 px-4">
        {([
          { v: "upcoming", label: `Upcoming (${upcoming.length})`,  icon: Sparkles },
          { v: "past",    label: `Past (${past.length})`,         icon: BookOpen },
          { v: "missed",  label: `Missed (${missed.length})`,       icon: Calendar  },
        ] as const).map((t) => {
          const active = tab === t.v;
          const Icon = t.icon;
          return (
            <Link
              key={t.v}
              href={`/m/participant?tab=${t.v}`}
              className={
                "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors " +
                (active
                  ? "text-white border-transparent"
                  : "bg-card border-border text-muted-foreground")
              }
              style={active ? { backgroundColor: "var(--brand)" } : undefined}
            >
              <Icon className="size-3.5" />
              {t.label}
            </Link>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Calendar className="mx-auto size-8 text-muted-foreground/60 mb-2" />
          <h2 className="text-sm font-semibold">
            {tab === "upcoming" ? "No upcoming classes" :
             tab === "past"    ? "No past classes yet"  :
                                  "Nothing missed"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            {tab === "upcoming" ? "Once HR enrolls you in a program, it&apos;ll show up here." : "Your completed sessions appear here."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {shown.map((p) => {
            if (!p.booking) return null;
            const b      = p.booking;
            const prog   = b.program;
            const date   = fmtDate(b.programDate);
            const status = p.attendanceStatus as keyof typeof STATUS_TONE;
            const quizCount  = prog.modules.length;
            const takenCount = p.quizResults.length;
            return (
              <li key={p.id}>
                <Link
                  href={`/m/participant/class/${b.id}`}
                  className="block bg-card border border-border rounded-2xl p-3.5 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="size-10 rounded-xl grid place-items-center shrink-0"
                      style={{ backgroundColor: "var(--brand-soft)", color: "var(--brand-deep)" }}
                    >
                      <BookOpen className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${STATUS_TONE[status] ?? "bg-slate-100 text-slate-700"}`}>
                          {status}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">
                          {prog.category}
                        </span>
                      </div>
                      <div className="text-sm font-bold leading-tight truncate">{prog.title}</div>
                      <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-0.5 truncate">
                        <Calendar className="size-3" /> {date} · {b.company.name}
                      </div>
                      {quizCount > 0 && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: quizCount }).map((_, i) => (
                              <span
                                key={i}
                                className={
                                  "size-2 rounded-full " +
                                  (i < takenCount ? "bg-emerald-500" : "bg-muted")
                                }
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {takenCount}/{quizCount} checkpoints
                          </span>
                          {takenCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                              style={{ color: "var(--brand-deep)" }}
                            >
                              <Trophy className="size-3" />
                              {Math.round(p.quizResults.reduce((s, q) => s + q.score, 0) / takenCount)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

