/**
 * /m/admin/programs — Admin tier 3 mobile route
 *
 * Cross-trainer programs overview for admin. Server component reads from
 * Prisma directly (same data source as /api/admin/programs). Brand-tinted
 * with admin purple.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  BookOpen, ArrowLeft, ChevronRight, Star, Users,} from "lucide-react";


export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  PUBLISHED: "bg-emerald-100 text-emerald-900",
  DRAFT:     "bg-amber-100  text-amber-900",
  ARCHIVED:  "bg-slate-100  text-slate-700",
};

const CATEGORY_TONE: Record<string, string> = {
  Leadership:    "bg-rose-100 text-rose-900",
  Technical:     "bg-emerald-100 text-emerald-900",
  "Soft Skills": "bg-violet-100 text-violet-900",
  Compliance:    "bg-amber-100 text-amber-900",
  "Team Building":"bg-orange-100 text-orange-900",
  "HR Operations":"bg-cyan-100 text-cyan-900",
};

export default async function MobileAdminProgramsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/m");

  const { status: statusFilter } = await searchParams;

  const where: Record<string, unknown> = {};
  if (statusFilter && statusFilter !== "ALL") where.status = statusFilter;

  const [programs, statusGroups] = await Promise.all([
    prisma.program.findMany({
      where,
      include: {
        trainer: { select: { name: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      take: 80,
    }).catch(() => []),
    prisma.program.groupBy({ by: ["status"], _count: true }).catch(() => []),
  ]);

  const counts: Record<string, number> = {};
  statusGroups.forEach((g) => { counts[g.status] = g._count; });

  const liveCount    = counts.PUBLISHED ?? 0;
  const draftCount   = counts.DRAFT     ?? 0;
  const archivedCount= counts.ARCHIVED  ?? 0;

  const filterValues = ["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"] as const;

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--brand)]">
          Catalog
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Programs</h1>
          <div className="text-xs text-muted-foreground">{programs.length} shown</div>
        </div>
      </header>

      {/* Stats strip — admin purple */}
      <section
        className="rounded-3xl p-5 text-white mb-5 relative overflow-hidden shadow-[0_14px_30px_-10px_rgba(139,92,246,0.4)]"
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
            <div className="text-[18px] font-extrabold leading-none tabular-nums">{archivedCount}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Archived</div>
          </div>
        </div>
      </section>

      {/* Status filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none -mx-4 px-4">
        {filterValues.map((v) => {
          const active = (statusFilter ?? "ALL") === v;
          const label =
            v === "ALL"      ? `All (${liveCount + draftCount + archivedCount})` :
            v === "PUBLISHED" ? `Live (${liveCount})` :
            v === "DRAFT"     ? `Drafts (${draftCount})` :
                                `Archived (${archivedCount})`;
          return (
            <Link
              key={v}
              href={v === "ALL" ? "/m/admin/programs" : `/m/admin/programs?status=${v}`}
              className={
                "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors " +
                (active
                  ? "text-white border-transparent"
                  : "bg-card border-border text-muted-foreground")
              }
              style={active ? { backgroundColor: "var(--brand)" } : undefined}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {programs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground/60 mb-2" />
          <h2 className="text-sm font-semibold">No programs found</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            Trainers create programs from their dashboard. They appear here once published.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {programs.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/programs`}
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
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_TONE[p.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {p.status}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${CATEGORY_TONE[p.category] ?? "bg-slate-100 text-slate-700"}`}>
                        {p.category}
                      </span>
                      {p.featured && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          <Star className="size-2.5 fill-current" /> Featured
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold leading-tight truncate">{p.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-2 flex-wrap">
                      <span>by {p.trainer.name}</span>
                      <span>·</span>
                      <span>{p.durationHours}h</span>
                      <span>·</span>
                      <span>RM {p.pricePerPax.toLocaleString()}/pax</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                      <Users className="size-3" /> {p._count.bookings} booking{p._count.bookings === 1 ? "" : "s"}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
