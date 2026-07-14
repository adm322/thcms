import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  CheckCircle2,
  FileText,
  BrainCircuit,
  Award,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ATTENDANCE_TONE: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-900 border-emerald-200",
  PENDING: "bg-amber-100 text-amber-900 border-amber-200",
  ABSENT: "bg-rose-100 text-rose-900 border-rose-200",
};

const ATTENDANCE_LABEL: Record<string, string> = {
  PRESENT: "Attended",
  PENDING: "Pending",
  ABSENT: "Absent",
};

export default async function ParticipantBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: bookingId } = await params;
  const session = await getSession();

  if (!session || session.role !== "PARTICIPANT") {
    redirect("/login");
  }

  const participant = await prisma.participant
    .findFirst({
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
    })
    .catch(() => null);

  if (!participant) {
    return (
      <div className="space-y-6">
        <Link
          href="/participant/bookings"
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Bookings
        </Link>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h2 className="text-sm font-semibold">Not Enrolled</h2>
            <p className="text-xs text-muted-foreground mt-1">
              You are not enrolled in this session.
            </p>
            <Link
              href="/participant/bookings"
              className="mt-4 text-sm font-medium text-blue-500 hover:underline"
            >
              Back to My Bookings
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { booking } = participant;
  const { program, company } = booking;
  const modules = program.modules ?? [];

  const dateStr = new Date(booking.programDate).toLocaleDateString("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = booking.programDate
    ? new Date(booking.programDate).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const isPast = booking.programDate
    ? new Date(booking.programDate) < new Date()
    : false;

  const quizCount = modules.reduce(
    (sum, m) => sum + (m.quizzes?.length ?? 0),
    0,
  );
  const takenQuizzes = participant.quizResults.length;
  const passedAll =
    quizCount === 0 ||
    (takenQuizzes === quizCount &&
      participant.quizResults.every((r) => r.score >= 50));
  const quizAvg =
    takenQuizzes > 0
      ? Math.round(
          participant.quizResults.reduce((s, r) => s + r.score, 0) /
            takenQuizzes,
        )
      : null;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/participant/bookings"
        className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Bookings
      </Link>

      {/* Header */}
      <div className="bg-black text-white rounded-lg p-8 shadow-sm relative overflow-hidden border border-border">
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                {program.title}
              </h1>
              <p className="text-sm text-slate-400">{company.name}</p>
            </div>
            <span
              className={cn(
                "shrink-0 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border",
                ATTENDANCE_TONE[participant.attendanceStatus] ??
                  ATTENDANCE_TONE.PENDING,
              )}
            >
              {participant.attendanceStatus === "PRESENT" ? (
                <CheckCircle2 className="size-3.5" />
              ) : null}
              {ATTENDANCE_LABEL[participant.attendanceStatus] ?? "Pending"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" /> {dateStr}
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Clock className="h-3.5 w-3.5 text-slate-400" /> {timeStr} ·{" "}
              {program.durationHours}h
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />{" "}
              {booking.venueAddress || program.locationType}
            </span>
          </div>
        </div>
      </div>

      {/* Check-in status */}
      {!isPast && participant.attendanceStatus === "PRESENT" && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800">
              You are checked in for this session.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modules */}
      {modules.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            Modules
          </h2>
          <div className="space-y-3">
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
                <Card key={mod.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {modQuizCount > 0 ? (
                        <BrainCircuit className="size-4 shrink-0 text-blue-500" />
                      ) : (
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium truncate">
                        {mod.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {modQuizCount > 0 ? (
                        <span
                          className={cn(
                            "text-xs font-bold",
                            modPassed
                              ? "text-emerald-600"
                              : modTaken > 0
                                ? "text-amber-600"
                                : "text-muted-foreground",
                          )}
                        >
                          {modTaken}/{modQuizCount} quizzes
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No quiz
                        </span>
                      )}
                      {modPassed && modQuizCount > 0 && (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Quiz results summary */}
      {quizCount > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Checkpoint Scores
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card>
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-extrabold font-mono tabular-nums">
                  {quizAvg !== null ? `${quizAvg}%` : "—"}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
                  Avg Score
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-extrabold font-mono tabular-nums">
                  {takenQuizzes}/{quizCount}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
                  Completed
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Per-module performance */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="size-4 text-amber-500" />
                <span className="text-xs uppercase tracking-wide font-bold text-muted-foreground">
                  Performance
                </span>
              </div>
              {modules
                .filter((m) => (m.quizzes?.length ?? 0) > 0)
                .map((mod) => {
                  const modResults = participant.quizResults.filter((r) =>
                    mod.quizzes?.some((q) => q.id === r.quizId),
                  );
                  const avg =
                    modResults.length > 0
                      ? Math.round(
                          modResults.reduce((s, r) => s + r.score, 0) /
                            modResults.length,
                        )
                      : null;
                  return (
                    <div
                      key={mod.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate flex-1 mr-2">{mod.title}</span>
                      <span
                        className={cn(
                          "font-bold tabular-nums",
                          avg === null
                            ? "text-muted-foreground"
                            : avg >= 70
                              ? "text-emerald-600"
                              : avg >= 50
                                ? "text-amber-600"
                                : "text-rose-600",
                        )}
                      >
                        {avg !== null ? `${avg}%` : "—"}
                      </span>
                    </div>
                  );
                })}
            </CardContent>
          </Card>

          {/* Certificate CTA */}
          {participant.attendanceStatus === "PRESENT" && passedAll ? (
            <a
              href={`/api/participants/${participant.id}/certificate`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 py-3 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-100 transition-colors"
            >
              <Award className="size-4" />
              Download Certificate
            </a>
          ) : participant.attendanceStatus === "PRESENT" && !passedAll ? (
            <Card className="mt-4 border-rose-200 bg-rose-50">
              <CardContent className="flex items-center gap-2 p-4">
                <p className="text-sm text-rose-700">
                  Complete all quizzes to earn your certificate.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </section>
      )}

      {quizCount === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              No quizzes for this program.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
