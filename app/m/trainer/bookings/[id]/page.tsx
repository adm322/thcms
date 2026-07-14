import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Video, FileText,
  CheckCircle2, Circle, XCircle, ChevronRight,
} from "lucide-react";


export const dynamic = "force-dynamic";

function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    weekday: "long", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusTone(status: string): { label: string; tone: string } {
  switch (status) {
    case "CONFIRMED": return { label: "Confirmed", tone: "bg-emerald-100 text-emerald-900" };
    case "COMPLETED": return { label: "Completed", tone: "bg-sky-100 text-sky-900"        };
    case "CANCELLED": return { label: "Cancelled", tone: "bg-rose-100 text-rose-900"        };
    default:          return { label: "Pending",   tone: "bg-amber-100 text-amber-900"      };
  }
}

const ATTENDANCE_META: Record<string, { icon: React.ReactNode; tone: string; label: string }> = {
  PRESENT: { icon: <CheckCircle2 className="size-4" />, tone: "text-emerald-600 bg-emerald-100", label: "Present" },
  PENDING: { icon: <Circle         className="size-4" />, tone: "text-amber-600   bg-amber-100",   label: "Pending" },
  ABSENT:  { icon: <XCircle       className="size-4" />, tone: "text-rose-600    bg-rose-100",    label: "Absent"  },
};

export default async function MobileBookingDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TRAINER") redirect("/m");

  const { id } = await params;

  const booking = await prisma.booking
    .findUnique({
      where: { id },
      include: {
        program: true,
        company: true,
        participants: { orderBy: { name: "asc" } },
      },
    })
    .catch(() => null);

  if (!booking) notFound();

  // Authorize: trainer must own this booking's program.
  if (booking.program.trainerId !== session.id) {
    redirect("/m");
  }

  const date = formatDateTime(booking.programDate);
  const tone = statusTone(booking.status);
  const attended = booking.participants.filter((p) => p.attendanceStatus === "PRESENT").length;
  const totalPax = booking.participants.length;

  return (
    <main className="px-4 pt-5 pb-24 space-y-4">
      <header>
        <Link
          href="/m"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
        <div className="flex items-start gap-2 justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
              Session
            </div>
            <h1 className="text-xl font-extrabold tracking-tight leading-tight">
              {booking.program.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{booking.company.name}</p>
          </div>
          <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full mt-1 ${tone.tone}`}>
            {tone.label}
          </span>
        </div>
      </header>

      {/* Facts card */}
      <section className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
        <Fact icon={<Calendar className="size-4" />} label="When"   value={date} />
        <Fact icon={<Clock    className="size-4" />} label="Duration" value={`${booking.program.durationHours} h`} />
        <Fact
          icon={<MapPin   className="size-4" />}
          label="Venue"
          value={
            booking.venueConfirmed && booking.venueAddress
              ? booking.venueAddress
              : booking.program.locationType === "online"
              ? "Online session"
              : "Venue TBD"
          }
        />
        {booking.meetingLink && (
          <Fact
            icon={<Video className="size-4" />}
            label="Meeting"
            value={booking.meetingLink}
            href={booking.meetingLink}
          />
        )}
        <Fact
          icon={<Users className="size-4" />}
          label="Attendance"
          value={`${attended} / ${totalPax} present (${totalPax ? Math.round((attended / totalPax) * 100) : 0}%)`}
        />
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-2">
        <Link
          href={`/trainer/bookings/${booking.id}/check-in`}
          className="bg-card border border-border rounded-2xl p-3.5 flex items-center justify-between active:scale-[0.99] transition-transform"
        >
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Mark</div>
            <div className="text-sm font-bold">Check-in</div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          href={`/trainer/programs/${booking.programId}`}
          className="bg-card border border-border rounded-2xl p-3.5 flex items-center justify-between active:scale-[0.99] transition-transform"
        >
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">View</div>
            <div className="text-sm font-bold">Materials</div>
          </div>
          <FileText className="size-4 text-muted-foreground" />
        </Link>
      </section>

      {/* Attendee list */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-bold tracking-tight">Attendees · {totalPax}</h2>
          <Link href={`/trainer/bookings/${booking.id}/evaluations/new`} className="text-[11px] font-bold text-[var(--brand)]">
            Ask for review →
          </Link>
        </div>

        {totalPax === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 py-10 text-center">
            <Users className="mx-auto size-6 text-muted-foreground/60 mb-1" />
            <p className="text-xs text-muted-foreground">No attendees registered yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {booking.participants.map((p) => {
              const meta = ATTENDANCE_META[p.attendanceStatus] ?? ATTENDANCE_META.PENDING;
              const initials = (p.name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
              return (
                <li key={p.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 grid place-items-center text-amber-900 font-bold text-sm shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    {p.department && (
                      <div className="text-[11px] text-muted-foreground truncate">{p.department}</div>
                    )}
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${meta.tone}`}>
                    {meta.icon}
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function Fact({
  icon, label, value, href,
}: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const Inner = (
    <div className="flex items-start gap-3">
      <div className="size-8 rounded-lg bg-muted text-muted-foreground grid place-items-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
        <div className="text-sm leading-snug break-words">{value}</div>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block active:scale-[0.99] transition-transform">{Inner}</Link> : Inner;
}
