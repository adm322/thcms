/**
 * /m/participant/class/[id] — Mobile class detail
 *
 * Server component. Shows the participant's enrollment for a specific
 * booking — attendance status, program details, modules, quiz progress,
 * certificate. Mirrors the desktop /participant/class/[id] but compressed
 * for mobile.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft, Calendar, Clock, MapPin, QrCode, BookOpen,
  CheckCircle2, FileText, BrainCircuit, Award, Trophy,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ATTENDANCE_TONE: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-900 border-emerald-200",
  PENDING: "bg-amber-100  text-amber-900  border-amber-200",
  ABSENT:  "bg-rose-100   text-rose-900   border-rose-200",
};

const ATTENDANCE_LABEL: Record<string, string> = {
  PRESENT: "Attended",
  PENDING: "Pending",
  ABSENT:  "Absent",
};

export default async function MobileClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: bookingId } = await params;
  const session = await getSession();

  if (!session || session.role !== "PARTICIPANT") {
    redirect("/login");
  }

  const participant = await prisma.participant.findFirst({
    where: {
      bookingId,
      OR: [{ userId: session.id }, { email: session.email }],
    },
    include: {
      quizResults: true,
      booking: {
        include: {
          program: {
            include: {
              modules: {
                orderBy: { orderIndex: "asc" },
                include: {
                  materials: { orderBy: { orderIndex: "asc" } },
                  quizzes: { orderBy: { createdAt: "asc" } },
                },
              },
            },
          },
          company: { select: { name: true } },
        },
      },
    },
  }).catch(() => null);

  if (!participant) {
    return (
      <main className="px-4 pt-5 pb-24">
        <Link href="/m/participant" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground/60 mb-2" />
          <h2 className="text-sm font-semibold">Not enrolled</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            You aren&apos;t enrolled in this session.
          </p>
        </div>
      </main>
    );
  }

  const { booking } = participant;
  const { program, company } = booking;
  const modules = program.modules ?? [];

  const dateStr = new Date(booking.programDate).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
  const timeStr = booking.programDate
    ? new Date(booking.programDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "—";

  const isPast = booking.programDate ? new Date(booking.programDate) < new Date() : false;

  const quizCount  = modules.reduce((sum, m) => sum + (m.quizzes?.length ?? 0), 0);
  const takenQuizzes = participant.quizResults.length;
  const passedAll = quizCount === 0 ||
    (takenQuizzes === quizCount && participant.quizResults.every((r) => r.score >= 50));
  const quizAvg = takenQuizzes > 0
    ? Math.round(participant.quizResults.reduce((s, r) => s + r.score, 0) / takenQuizzes)
    : null;

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m/participant" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--brand)]">
          Class Detail
        </div>
        <div className="flex items-start gap-2 justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold tracking-tight leading-tight">
              {program.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{company.name}</p>
          </div>
          <span className={cn(
            "shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border mt-1",
            ATTENDANCE_TONE[participant.attendanceStatus] ?? ATTENDANCE_TONE.PENDING,
          )}>
            {ATTENDANCE_LABEL[participant.attendanceStatus] ?? "Pending"}
          </span>
        </div>
      </header>

      {/* Hero — participant blue */}
      <section
        className="rounded-3xl p-5 text-white mb-5 relative overflow-hidden shadow-[0_14px_30px_-10px_rgba(14,165,233,0.4)]"
        style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
      >
        <div className="grid grid-cols-3 gap-2 relative">
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">{program.durationHours}h</div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Duration</div>
          </div>
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">{modules.length}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Modules</div>
          </div>
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">
              {takenQuizzes}/{quizCount || "—"}
            </div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Quizzes</div>
          </div>
        </div>
      </section>

      {/* Facts */}
      <section className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3 mb-5">
        <Fact icon={<Calendar className="size-4" />} label="When"   value={dateStr} />
        <Fact icon={<Clock    className="size-4" />} label="Time"   value={`${timeStr} · ${program.durationHours}h`} />
        <Fact icon={<MapPin   className="size-4" />} label="Where"  value={booking.venueAddress ? `${booking.venueAddress} · ${program.locationType}` : program.locationType} />
        <Fact icon={<BookOpen className="size-4" />} label="Category" value={program.category} />
      </section>

      {/* Check-in CTA */}
      {!isPast && participant.attendanceStatus === "PENDING" && (
        <Link
          href="/m/participant/scan"
          className="flex w-full items-center justify-center gap-3 rounded-full text-white py-4 text-sm font-bold shadow-lg active:scale-[0.98] transition-transform mb-5"
          style={{
            backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))",
            boxShadow: "0 14px 30px -10px var(--brand-deep)55",
          }}
        >
          <QrCode className="size-5" />
          Scan QR to Check In
        </Link>
      )}

      {!isPast && participant.attendanceStatus === "PRESENT" && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 mb-5">
          <CheckCircle2 className="size-5 text-emerald-600" />
          You are checked in for this session.
        </div>
      )}

      {/* Modules */}
      {modules.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold tracking-tight mb-2.5">Modules</h2>
          <ul className="space-y-2">
            {modules.map((mod) => {
              const modQuizCount = mod.quizzes?.length ?? 0;
              const modTaken = participant.quizResults.filter((r) =>
                mod.quizzes?.some((q) => q.id === r.quizId),
              ).length;
              const modPassed =
                modQuizCount === 0 ||
                (modTaken === modQuizCount &&
                  mod.quizzes?.every((q) =>
                    participant.quizResults.find(
                      (r) => r.quizId === q.id && r.score >= 50,
                    ),
                  ));

              return (
                <li
                  key={mod.id}
                  className="flex items-center justify-between bg-card border border-border rounded-2xl px-3.5 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {modQuizCount > 0 ? (
                      <BrainCircuit
                        className="size-4 shrink-0"
                        style={{ color: "var(--brand)" }}
                      />
                    ) : (
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-sm font-bold truncate">{mod.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {modQuizCount > 0 ? (
                      <span
                        className={cn(
                          "text-[11px] font-bold",
                          modPassed
                            ? "text-emerald-600"
                            : modTaken > 0
                            ? "text-amber-600"
                            : "text-muted-foreground",
                        )}
                      >
                        {modTaken}/{modQuizCount}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">No quiz</span>
                    )}
                    {modPassed && modQuizCount > 0 && (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Quiz results */}
      {quizCount > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold tracking-tight mb-2.5">Checkpoint Scores</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-card border border-border rounded-2xl p-3.5 text-center shadow-sm">
              <div className="text-[20px] font-extrabold tabular-nums" style={{ color: "var(--brand-deep)" }}>
                {quizAvg !== null ? `${quizAvg}%` : "—"}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">Avg Score</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-3.5 text-center shadow-sm">
              <div className="text-[20px] font-extrabold tabular-nums">
                {takenQuizzes}/{quizCount}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">Completed</div>
            </div>
          </div>

          {/* Avg per module */}
          <div className="bg-card border border-border rounded-2xl p-3 shadow-sm mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="size-4" style={{ color: "var(--brand-deep)" }} />
              <span className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground">Performance</span>
            </div>
            <div className="space-y-1.5">
              {modules.filter((m) => (m.quizzes?.length ?? 0) > 0).map((mod) => {
                const modResults = participant.quizResults.filter((r) =>
                  mod.quizzes?.some((q) => q.id === r.quizId),
                );
                const avg = modResults.length > 0
                  ? Math.round(modResults.reduce((s, r) => s + r.score, 0) / modResults.length)
                  : null;
                return (
                  <div key={mod.id} className="flex items-center justify-between text-[12px]">
                    <span className="truncate flex-1 mr-2">{mod.title}</span>
                    <span
                      className={cn(
                        "font-bold tabular-nums",
                        avg === null ? "text-muted-foreground" :
                        avg >= 70 ? "text-emerald-600" :
                        avg >= 50 ? "text-amber-600" :
                                    "text-rose-600",
                      )}
                    >
                      {avg !== null ? `${avg}%` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificate CTA */}
          {participant.attendanceStatus === "PRESENT" && passedAll && (
            <a
              href={`/api/participants/${participant.id}/certificate`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 py-3 text-sm font-bold text-emerald-700 shadow-sm active:scale-[0.98] transition-transform"
            >
              <Award className="size-4" />
              Download Certificate
            </a>
          )}
          {participant.attendanceStatus === "PRESENT" && !passedAll && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Complete all quizzes to earn your certificate.
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
      <div className="text-sm min-w-0">
        <div className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">{label}</div>
        <div className="leading-snug">{value}</div>
      </div>
    </div>
  );
}