import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, Clock, MapPin, BookOpen, ChevronRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ATTENDANCE_TONE: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  ABSENT: "bg-rose-100 text-rose-800 border-rose-200",
};

const ATTENDANCE_LABEL: Record<string, string> = {
  PRESENT: "Attended",
  PENDING: "Pending",
  ABSENT: "Absent",
};

export default async function ParticipantBookingsPage() {
  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT") {
    redirect("/login");
  }

  const participations = await prisma.participant
    .findMany({
      where: {
        OR: [{ userId: session.id }, { email: session.email }],
      },
      include: {
        booking: {
          include: {
            program: true,
            company: { select: { name: true } },
          },
        },
        quizResults: { select: { id: true, score: true } },
      },
      orderBy: { booking: { programDate: "asc" } },
        take: 100,
        skip: 0
    })
    .catch(() => []);

  const now = new Date();
  const upcoming = participations.filter(
    (p) =>
      p.attendanceStatus === "PENDING" &&
      p.booking &&
      new Date(p.booking.programDate) >= now,
  );
  const past = participations.filter(
    (p) =>
      p.attendanceStatus === "PRESENT" ||
      (p.booking && new Date(p.booking.programDate) < now),
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {participations.length} total · {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
      </div>

      {participations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold">No bookings yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Once HR enrolls you in a program, it will show up here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participations.map((p) => {
            if (!p.booking) return null;
            const { booking } = p;
            const { program, company } = booking;
            const dateStr = new Date(booking.programDate).toLocaleDateString(
              "en-MY",
              { day: "numeric", month: "long", year: "numeric" },
            );
            const isUpcoming =
              p.attendanceStatus === "PENDING" &&
              new Date(booking.programDate) >= now;

            return (
              <Link
                key={p.id}
                href={`/participant/bookings/${booking.id}`}
                className="group"
              >
                <Card className="h-full border hover:border-slate-400 hover:shadow-sm transition-all duration-200">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-mono tracking-wider rounded-full"
                      >
                        {program.category || "Training"}
                      </Badge>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border",
                          ATTENDANCE_TONE[p.attendanceStatus] ??
                            ATTENDANCE_TONE.PENDING,
                        )}
                      >
                        {p.attendanceStatus === "PRESENT" ? (
                          <CheckCircle2 className="size-3" />
                        ) : null}
                        {ATTENDANCE_LABEL[p.attendanceStatus] ?? "Pending"}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-foreground leading-tight group-hover:text-blue-600 transition-colors">
                      {program.title}
                    </h3>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{dateStr}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{program.durationHours}h</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {booking.venueAddress || program.locationType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-[11px] text-muted-foreground">
                        {company.name}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
