import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  Search, Star, Mail, ChevronRight, Plus, ArrowLeft,} from "lucide-react";


export const dynamic = "force-dynamic";

export default async function MobileAdminTrainersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/m");

  const { q } = await searchParams;
  const search = (q ?? "").trim();

  // SQLite's LIKE is case-insensitive by default for ASCII, so no `mode` needed.
  const trainers = await prisma.user.findMany({
    where: {
      role: "TRAINER",
      ...(search
        ? {
            OR: [
              { name:  { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      programs: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
      skip: 0
}).catch(() => []);

  // Aggregate ratings across all trainers' completed bookings.
  const allEvalRows = await prisma.evaluation.findMany({
    where: {
      booking: {
        program: { trainer: { role: "TRAINER" } },
        status: "COMPLETED",
      },
    },
    select: { summaryScore: true, booking: { select: { program: { select: { trainerId: true } } } } },
      take: 100,
      skip: 0
}).catch(() => []);

  const ratingByTrainer = new Map<string, { sum: number; count: number }>();
  allEvalRows.forEach((e) => {
    const tid = e.booking?.program?.trainerId;
    if (!tid) return;
    if (!ratingByTrainer.has(tid)) ratingByTrainer.set(tid, { sum: 0, count: 0 });
    const agg = ratingByTrainer.get(tid)!;
    agg.sum += e.summaryScore ?? 0;
    agg.count += 1;
  });

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--brand)]">
          Team
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Trainers</h1>
          <div className="text-xs text-muted-foreground">{trainers.length} active</div>
        </div>
      </header>

      <form action="/m/admin/trainers" method="GET" className="mb-4">
        <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[var(--brand)]/30">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search trainers by name or email…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </form>

      {trainers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <p className="text-sm font-semibold">{search ? "No results" : "No trainers yet"}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            {search ? `Nothing matched “${search}”.` : "Trainers invited via /admin/trainers will appear here."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {trainers.map((t) => {
            const livePrograms = t.programs.filter((p) => p.status === "PUBLISHED").length;
            const agg          = ratingByTrainer.get(t.id);
            const avgRating    = agg && agg.count > 0 ? agg.sum / agg.count : 0;
            const initials     = (t.name || t.email).split(/\s|@/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
            return (
              <li key={t.id}>
                <Link
                  href={`/admin/trainers/${t.id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3 active:scale-[0.99] transition-transform"
                >
                  <div
                    className="size-11 rounded-full grid place-items-center text-white font-bold shrink-0"
                    style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate inline-flex items-center gap-1">
                      <Mail className="size-3" /> {t.email}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--brand-soft)", color: "var(--brand-deep)" }}>
                        {t.programs.length} prog · {livePrograms} live
                      </span>
                      {avgRating > 0 && (
                        <span className="text-[11px] inline-flex items-center gap-1 text-muted-foreground">
                          <Star className="size-3 fill-amber-400 text-amber-400" /> {avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/admin/trainers"
        className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-transform"
        style={{
          backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))",
          boxShadow: "0 14px 30px -10px var(--brand-deep)55",
        }}
      >
        <Plus className="size-4" />
        Invite trainer
      </Link>
    </main>
  );
}

