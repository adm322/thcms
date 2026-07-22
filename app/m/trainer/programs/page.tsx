import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  BookOpen, Plus, ArrowLeft, ChevronRight,} from "lucide-react";


export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  PUBLISHED: "bg-emerald-100 text-emerald-900",
  DRAFT:     "bg-amber-100  text-amber-900",
  ARCHIVED:  "bg-slate-100   text-slate-700",
};

export default async function MobileTrainerProgramsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TRAINER") redirect("/m");

  const programs = await prisma.program.findMany({
    where: { trainerId: session.id },
    include: {
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
      skip: 0
}).catch(() => []);

  const liveCount = programs.filter((p) => p.status === "PUBLISHED").length;
  const draftCount = programs.filter((p) => p.status === "DRAFT").length;
  const totalBookings = programs.reduce((s, p) => s + p._count.bookings, 0);

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--brand)]">
          My Programs
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Materials</h1>
          <div className="text-xs text-muted-foreground">{programs.length} total</div>
        </div>
      </header>

      {/* Stats strip */}
      <section
        className="rounded-3xl p-5 text-white mb-5 relative overflow-hidden shadow-[0_14px_30px_-10px_rgba(16,196,108,0.4)]"
        style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
      >
        <div className="grid grid-cols-3 gap-2 relative">
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">{liveCount}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Live</div>
          </div>
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">{draftCount}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Drafts</div>
          </div>
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">{totalBookings}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Bookings</div>
          </div>
        </div>
      </section>

      {programs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground/60 mb-2" />
          <h2 className="text-sm font-semibold">No programs yet</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            Create your first training program — published ones go into the catalog.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {programs.map((p) => (
            <li key={p.id}>
              <Link
                href={`/m/trainer/programs/${p.id}`}
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
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_TONE[p.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {p.status}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">
                        {p.category}
                      </span>
                    </div>
                    <div className="text-sm font-bold leading-tight mt-1 truncate">{p.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-2 flex-wrap">
                      <span>{p.durationHours}h</span>
                      <span>·</span>
                      <span>RM {p.pricePerPax.toLocaleString()}/pax</span>
                      <span>·</span>
                      <span>{p._count.bookings} bookings</span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/m/trainer/programs/new"
        className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-transform"
        style={{
          backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))",
          boxShadow: "0 14px 30px -10px var(--brand-deep)55",
        }}
      >
        <Plus className="size-4" />
        New program
      </Link>
    </main>
  );
}

