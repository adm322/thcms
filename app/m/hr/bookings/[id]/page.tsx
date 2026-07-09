import {
  BOOKING_STATUS_TONE as STATUS_TONE,
  ATTENDANCE_TONE,
  ATTENDANCE_LABEL,
} from "@/components/mobile-dashboard/types";
/**
 * /m/hr/bookings/[id] — Mobile booking detail (HR view)
 *
 * Server component. Mirrors /m/participant/bookings/[id] for style.
 * Shows program, date, venue, trainer, attendance summary, participants
 * list, and action bar (Show QR, View on web).
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  ArrowLeft, Calendar, Clock, MapPin, User, Video, Users,
  ExternalLink, BookOpen, Building2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ShowQRButton } from "./ShowQRButton";

export const dynamic = "force-dynamic";







interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MobileHRBookingDetailPage({ params }: PageProps) {
  const { id: bookingId } = await params;
  const session = await getSession();

  if (!session) redirect("/login");
  if (session.role !== "HR") redirect("/m");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      program: {
        include: {
          trainer: { select: { name: true } },
        },
      },
      company: { select: { name: true } },
      participants: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          attendanceStatus: true,
          certificateUrl: true,
        },
      },
    },
  }).catch(() => null);

  if (!booking || booking.companyId !== session.companyId) {
    return (
      <main className="px-4 pt-4 pb-8 space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href="/m/hr/calendar"
            className="grid place-items-center size-9 rounded-full bg-white border border-border shadow-sm"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-[17px] font-bold tracking-tight">Booking Not Found</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border bg-white">
          <BookOpen className="size-12 text-muted-foreground mb-3" />
          <p className="text-sm font-semibold">
            This booking does not exist or is from another company.
          </p>
          <Link
            href="/m/hr/calendar"
            className="mt-4 text-sm font-medium text-blue-500"
          >
            Back to Calendar
          </Link>
        </div>
      </main>
    );
  }

  // ─── Derived data ────────────────────────────────────────────
  const program = booking.program;
  const dateStr = new Date(booking.programDate).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = new Date(booking.programDate).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
  const isPast = new Date(booking.programDate) < new Date();
  const isCancellable = !isPast
    && booking.status !== "CANCELLED"
    && booking.status !== "COMPLETED";

  // Attendance tally
  const attCounts = {
    PRESENT: booking.participants.filter((p) => p.attendanceStatus === "PRESENT").length,
    ABSENT:  booking.participants.filter((p) => p.attendanceStatus === "ABSENT").length,
    PENDING: booking.participants.filter((p) => p.attendanceStatus === "PENDING").length,
  };
  const totalPax = booking.participants.length;
  const presentPct = totalPax > 0
    ? Math.round((attCounts.PRESENT / totalPax) * 100)
    : 0;

  return (
    <main className="px-4 pt-4 pb-28 space-y-4">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/m/hr/calendar"
          className="grid place-items-center size-9 rounded-full bg-white border border-border shadow-sm"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[17px] font-bold tracking-tight truncate">
            {program.title}
          </h1>
          <p className="text-[12px] text-muted-foreground truncate inline-flex items-center gap-1">
            <Building2 className="size-3" /> {booking.company.name}
            <span className="mx-1.5 opacity-50">·</span>
            <span>{program.category}</span>
          </p>
        </div>
      </div>

      {/* ── Status pill ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn(
          "inline-flex items-center text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full",
          STATUS_TONE[booking.status] ?? "bg-slate-100 text-slate-900",
        )}>
          {booking.status}
        </span>
        {isPast && booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (
          <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-rose-100 text-rose-900">
            Needs review
          </span>
        )}
      </div>

      {/* ── Hero details card ───────────────────────────────── */}
      <section className="space-y-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Calendar className="size-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm">{dateStr}</div>
        </div>
        <div className="flex items-start gap-3">
          <Clock className="size-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm">
            {timeStr} · {program.durationHours}h
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm">
            {booking.venueAddress
              ? `${booking.venueAddress}`
              : booking.venuePreference === "online"
              ? "Online session"
              : "Venue to be confirmed"}
            {program.locationType && (
              <span className="text-muted-foreground"> · {program.locationType}</span>
            )}
          </div>
        </div>
        {booking.meetingLink && (
          <div className="flex items-start gap-3">
            <Video className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <a
              href={booking.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-500 underline break-all"
            >
              {booking.meetingLink}
            </a>
          </div>
        )}
        {program.trainer.name && (
          <div className="flex items-start gap-3">
            <User className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-sm">
              Trainer · {program.trainer.name}
            </div>
          </div>
        )}
      </section>

      {/* ── Attendance summary ───────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-[14px] font-bold tracking-tight">Attendance</h2>
          <div className="text-[11px] text-muted-foreground tabular-nums">
            {attCounts.PRESENT}/{totalPax} present
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-3">
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${presentPct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[20px] font-extrabold text-emerald-600 tabular-nums">{attCounts.PRESENT}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">Present</div>
            </div>
            <div>
              <div className="text-[20px] font-extrabold text-amber-600 tabular-nums">{attCounts.PENDING}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">Pending</div>
            </div>
            <div>
              <div className="text-[20px] font-extrabold text-rose-600 tabular-nums">{attCounts.ABSENT}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">Absent</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Participants list ───────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-[14px] font-bold tracking-tight">Participants</h2>
          <div className="text-[11px] text-muted-foreground">{totalPax} enrolled</div>
        </div>
        {totalPax === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 py-12 text-center">
            <Users className="mx-auto size-8 text-muted-foreground/60 mb-2" />
            <p className="text-xs text-muted-foreground">No participants yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {booking.participants.map((p) => {
              const initials = p.name
                .split(/\s+/)
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm"
                >
                  <div className="grid place-items-center size-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-[11px] font-extrabold shrink-0">
                    {initials || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold truncate">{p.name}</div>
                    {p.email && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        {p.email}
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                    ATTENDANCE_TONE[p.attendanceStatus] ?? "bg-slate-100 text-slate-900",
                  )}>
                    {ATTENDANCE_LABEL[p.attendanceStatus] ?? p.attendanceStatus}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Action bar (stuck at bottom in the flow) ────────── */}
      <section className="pt-2 space-y-2">
        <ShowQRButton bookingId={booking.id} />

        {isCancellable && (
          <button
            type="button"
            className="w-full rounded-full border border-rose-200 bg-rose-50 py-3.5 text-sm font-bold text-rose-700 active:scale-[0.98] transition-transform"
            disabled
            title="Cancel flow coming soon — for now, use the web dashboard"
          >
            Cancel booking (use web)
          </button>
        )}

        <a
          href={`/hr/bookings/${booking.id}`}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white py-3.5 text-sm font-bold text-slate-700 active:scale-[0.98] transition-transform"
        >
          <ExternalLink className="size-4" />
          Open full details on web
        </a>
      </section>
    </main>
  );
}
