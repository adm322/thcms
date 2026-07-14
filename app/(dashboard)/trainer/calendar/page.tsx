import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { GET as getCalendar } from "@/app/api/trainer/calendar/route";
import { CalendarView, type CalendarEvent } from "@/components/CalendarView";

export const dynamic = "force-dynamic";

async function safeFetch<T>(fn: () => Promise<Response>, fallback: T): Promise<T> {
  try {
    const res = await fn();
    return await res.json();
  } catch {
    return fallback;
  }
}

export default async function TrainerCalendarPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TRAINER") redirect("/trainer");

  const data = await safeFetch(() => getCalendar(), { bookings: [], upcoming: [] });

  const events: CalendarEvent[] = (data.bookings || []).map((b: any) => ({
    id: b.id,
    title: b.title,
    category: b.category || "Training",
    date: b.date,
    status: b.status,
    companyName: b.companyName,
    trainerName: b.trainerName || session.name,
    locationType: b.locationType || "Venue",
    participantCount: b.participantCount,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Training Calendar</h1>
        <p className="text-muted-foreground text-sm">View and manage your scheduled sessions</p>
      </div>

      <CalendarView events={events} />
    </div>
  );
}
