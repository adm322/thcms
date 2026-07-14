import { BOOKING_STATUS_TONE as STATUS_TONE } from "@/components/mobile-dashboard/types";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  Wallet, ArrowLeft, TrendingUp, ChevronRight,
} from "lucide-react";


export const dynamic = "force-dynamic";



export default async function MobileTrainerEarningsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TRAINER") redirect("/m");

  const bookings = await prisma.booking.findMany({
    where: {
      program: { trainerId: session.id },
      status:  { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
    },
    include: {
      program: { select: { title: true } },
      company: { select: { name: true } },
    },
    orderBy: { programDate: "desc" },
    take: 60,
  }).catch(() => []);

  const TOTAL_RATE   = 0.85; // trainer's cut
  const now          = new Date();
  const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1);
  const totalRevenue = bookings.reduce((s, b) => s + b.totalFee * TOTAL_RATE, 0);
  const thisMonth    = bookings.filter((b) => new Date(b.programDate) >= monthStart);
  const thisMonthSum = thisMonth.reduce((s, b) => s + b.totalFee * TOTAL_RATE, 0);
  const pendingSum   = bookings.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED").reduce((s, b) => s + b.totalFee * TOTAL_RATE, 0);

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--brand)]">
          My Earnings
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Earnings</h1>
      </header>

      {/* Top stat */}
      <section
        className="rounded-3xl p-5 text-white mb-5 relative overflow-hidden shadow-[0_14px_30px_-10px_rgba(16,196,108,0.4)]"
        style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
      >
        <div className="flex items-baseline gap-2">
          <TrendingUp className="size-4 opacity-85" />
          <div className="text-[11px] uppercase tracking-[0.08em] font-semibold opacity-85">Total lifetime</div>
        </div>
        <div className="text-[28px] font-extrabold tabular-nums mt-1.5">RM {Math.round(totalRevenue).toLocaleString()}</div>
        <div className="text-[11px] opacity-85 mt-1">85% trainer share of {bookings.length} booking{bookings.length === 1 ? "" : "s"}</div>
      </section>

      {/* Two stat cards */}
      <section className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card border border-border rounded-2xl p-3.5 shadow-sm">
          <div className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">This month</div>
          <div className="text-lg font-extrabold tabular-nums mt-1" style={{ color: "var(--brand-deep)" }}>
            RM {Math.round(thisMonthSum).toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{thisMonth.length} booking{thisMonth.length === 1 ? "" : "s"}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3.5 shadow-sm">
          <div className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">Pending payout</div>
          <div className="text-lg font-extrabold tabular-nums mt-1 text-amber-700">
            RM {Math.round(pendingSum).toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">PENDING + CONFIRMED</div>
        </div>
      </section>

      <h2 className="text-sm font-bold tracking-tight mb-2.5">Recent bookings</h2>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Wallet className="mx-auto size-8 text-muted-foreground/60 mb-2" />
          <h2 className="text-sm font-semibold">No bookings yet</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            Earnings appear here once companies book your programs.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {bookings.slice(0, 20).map((b) => {
            const date = new Date(b.programDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            const amount = b.totalFee * TOTAL_RATE;
            return (
              <li key={b.id}>
                <Link
                  href={`/m/trainer/bookings/${b.id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3 active:scale-[0.99] transition-transform"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full ${STATUS_TONE[b.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="text-sm font-bold truncate">{b.program.title}</div>
                    <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-0.5 truncate">
                      {b.company.name} · {date}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-extrabold tabular-nums" style={{ color: "var(--brand-deep)" }}>
                      RM {Math.round(amount).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{Math.round(TOTAL_RATE * 100)}% share</div>
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

