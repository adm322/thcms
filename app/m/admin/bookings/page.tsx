import { BOOKING_STATUS_TONE as STATUS_TONE } from "@/components/mobile-dashboard/types";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  ChevronRight, Building2, Users, Search, ArrowLeft,
} from "lucide-react";


export const dynamic = "force-dynamic";



const FILTERS = [
  { value: "",          label: "All" },
  { value: "PENDING",   label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

type BookingRow = {
  id: string;
  status: string;
  programDate: Date;
  totalFee: number;
  program:   { title: string };
  company:   { name: string };
  participants: { id: string }[];
};

export default async function MobileAdminBookingsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/m");

  const { status, q } = await searchParams;
  const filterStatus = status ?? "";
  const search       = (q ?? "").trim();

  const bookings = await prisma.booking.findMany({
    where: {
      ...(filterStatus ? { status: filterStatus } : {}),
      ...(search
        ? {
            OR: [
              { id:      { contains: search } },
              { program: { title:    { contains: search } } },
              { company: { name:     { contains: search } } },
            ],
          }
        : {}),
    },
    include: {
      program:      true,
      company:      true,
      participants: { select: { id: true } },
    },
    orderBy: [{ status: "asc" }, { programDate: "desc" }],
    take: 60,
      skip: 0
}).catch(() => []);

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--brand)]">
          All Bookings
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Bookings</h1>
          <div className="text-xs text-muted-foreground">{bookings.length} total</div>
        </div>
      </header>

      <form action="/m/admin/bookings" method="GET" className="mb-4 space-y-2.5">
        <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[var(--brand)]/30">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search by company, program, id…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          {filterStatus && <input type="hidden" name="status" value={filterStatus} />}
        </div>
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 pb-1 min-w-max">
            {FILTERS.map((f) => {
              const active = (filterStatus || "") === f.value;
              const href   = `/m/admin/bookings?q=${encodeURIComponent(search)}${f.value ? `&status=${f.value}` : ""}`;
              return (
                <Link
                  key={f.value || "all"}
                  href={href}
                  className={
                    "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors " +
                    (active
                      ? "text-white border-transparent"
                      : "bg-card border-border text-muted-foreground")
                  }
                  style={active ? { backgroundColor: "var(--brand)" } : undefined}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>
        </div>
      </form>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <p className="text-sm font-semibold">No bookings{filterStatus ? ` with status ${filterStatus}` : ""}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try a different filter or check back later.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {bookings.map((b: BookingRow) => {
            const date = new Date(b.programDate).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
            const pax  = b.participants.length;
            return (
              <li key={b.id}>
                <Link
                  href={`/admin/bookings/${b.id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3 active:scale-[0.99] transition-transform"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full ${STATUS_TONE[b.status] ?? "bg-slate-100 text-slate-900"}`}>
                        {b.status}
                      </span>
                      <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                        <Users className="size-3" /> {pax}
                      </span>
                    </div>
                    <div className="text-sm font-bold truncate">{b.program.title}</div>
                    <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-0.5 truncate">
                      <Building2 className="size-3" /> {b.company.name} · {date}
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                      RM {b.totalFee.toLocaleString()}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

