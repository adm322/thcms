import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  Star, ArrowLeft, ChevronRight, Sparkles,} from "lucide-react";


export const dynamic = "force-dynamic";

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function MobileTrainerEvaluationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TRAINER") redirect("/m");

  const evaluations = await prisma.evaluation.findMany({
    where: {
      booking: {
        program: { trainerId: session.id },
        status:  "COMPLETED",
      },
    },
    include: {
      booking: {
        include: {
          program: true,
          company: true,
        },
      },
    },
    orderBy: { completedAt: { sort: "desc", nulls: "last" } },
    take: 50,
  }).catch(() => []);

  // Aggregate ratings.
  const completed = evaluations.filter((e) => e.completedAt != null);
  const ratings    = completed.map((e) => e.summaryScore).filter((n): n is number => typeof n === "number" && n > 0);
  const avgRating  = ratings.length ? ratings.reduce((s, n) => s + n, 0) / ratings.length : 0;

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--brand)]">
          My Reviews
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Evaluations</h1>
      </header>

      {/* Headline */}
      <section
        className="rounded-3xl p-5 text-white mb-5 relative overflow-hidden shadow-[0_14px_30px_-10px_rgba(16,196,108,0.4)]"
        style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
      >
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className="size-5"
              style={{
                fill: avgRating >= i - 0.5 ? "currentColor" : "rgba(255,255,255,0.3)",
                color: avgRating >= i - 0.5 ? "#fbbf24" : "rgba(255,255,255,0.5)",
              }}
              strokeWidth={1.5}
            />
          ))}
        </div>
        <div className="text-[28px] font-extrabold tabular-nums mt-2">{avgRating.toFixed(1)} <span className="text-base font-bold opacity-80">/ 5</span></div>
        <div className="text-[11px] opacity-85 mt-1">{completed.length} review{completed.length === 1 ? "" : "s"} submitted</div>
      </section>

      {evaluations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Sparkles className="mx-auto size-8 text-muted-foreground/60 mb-2" />
          <h2 className="text-sm font-semibold">No reviews yet</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            Once companies submit evaluations after your sessions, they&apos;ll show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {evaluations.map((e) => {
            const r  = typeof e.summaryScore === "number" ? e.summaryScore : 0;
            const dt = e.completedAt ? formatDate(e.completedAt) : "Pending";
            return (
              <li key={e.id}>
                <Link
                  href={`/m/trainer/bookings/${e.bookingId}`}
                  className="block bg-card border border-border rounded-2xl p-3.5 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl grid place-items-center shrink-0 text-base font-extrabold"
                      style={{ backgroundColor: "var(--brand-soft)", color: "var(--brand-deep)" }}>
                      {r.toFixed(1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{e.title || "Untitled evaluation"}</div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {e.booking.program.title} · {e.booking.company.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className="size-3"
                              style={{
                                fill: r >= i - 0.5 ? "#fbbf24" : "rgba(0,0,0,0.1)",
                                color: r >= i - 0.5 ? "#fbbf24" : "rgba(0,0,0,0.25)",
                              }}
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-muted-foreground">·</span>
                        <span className="text-[11px] text-muted-foreground">{dt}</span>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

