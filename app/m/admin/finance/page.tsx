/**
 * /m/admin/finance — Admin tier 3 mobile route
 *
 * Mobile-shaped finance overview: hero total, breakdown KPIs, recent
 * invoices. Same data as /api/admin/finance but loaded via Prisma direct.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  DollarSign, ArrowLeft, TrendingUp, Building2, Landmark, Wallet, Receipt,
  ChevronRight,
} from "lucide-react";


export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  PAID:      "bg-emerald-100 text-emerald-900",
  SENT:      "bg-amber-100  text-amber-900",
  PENDING:   "bg-slate-100  text-slate-700",
  OVERDUE:   "bg-rose-100   text-rose-900",
  CANCELLED: "bg-slate-100  text-slate-700",
};

function breakdown(invoice: { amount: number | null; platformFee?: number | null; trainerFee?: number | null; hrdfFee?: number | null; sst?: number | null; netPay?: number | null }) {
  const amount = invoice.amount || 0;
  const platformFee = invoice.platformFee ?? Math.round(amount * 0.12);
  const trainerFee  = invoice.trainerFee  ?? (amount - platformFee);
  const hrdfFee     = invoice.hrdfFee     ?? Math.round(amount * 0.01);
  const sst         = invoice.sst         ?? Math.round(platformFee * 0.08);
  const netPay      = invoice.netPay      ?? (trainerFee - sst);
  return { programFee: amount, platformFee, trainerFee, hrdfFee, sst, netPay };
}

export default async function MobileAdminFinancePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/m");

  const invoices = await prisma.invoice.findMany({
    include: {
      booking: {
        select: {
          program: { select: { title: true, trainer: { select: { name: true } } } },
          company: { select: { name: true } },
        },
      },
    },
    orderBy: { issuedAt: "desc" },
    take: 60,
  }).catch(() => []);

  // Aggregate paid invoices
  const withBd = invoices.map((inv) => ({ ...inv, ...breakdown(inv) }));
  const paid   = withBd.filter((i) => i.status === "PAID");

  const totals = {
    programFees:   paid.reduce((s, i) => s + i.programFee, 0),
    trainerFees:   paid.reduce((s, i) => s + i.trainerFee, 0),
    platformFees:  paid.reduce((s, i) => s + i.platformFee, 0),
    hrdf:          paid.reduce((s, i) => s + i.hrdfFee, 0),
    sst:           paid.reduce((s, i) => s + i.sst, 0),
    netPay:        paid.reduce((s, i) => s + i.netPay, 0),
  };

  const pendingSum = withBd
    .filter((i) => i.status === "PENDING" || i.status === "SENT")
    .reduce((s, i) => s + i.programFee, 0);

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--brand)]">
          Platform Money
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Finance</h1>
      </header>

      {/* Hero — total paid program fees */}
      <section
        className="rounded-3xl p-5 text-white mb-5 relative overflow-hidden shadow-[0_14px_30px_-10px_rgba(139,92,246,0.4)]"
        style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
      >
        <div className="flex items-baseline gap-2">
          <DollarSign className="size-4 opacity-85" />
          <div className="text-[11px] uppercase tracking-[0.08em] font-semibold opacity-85">Paid program fees</div>
        </div>
        <div className="text-[28px] font-extrabold tabular-nums mt-1.5">RM {Math.round(totals.programFees).toLocaleString()}</div>
        <div className="text-[11px] opacity-85 mt-1">{paid.length} paid invoice{paid.length === 1 ? "" : "s"} · across {invoices.length} total</div>
      </section>

      {/* Two KPI cards */}
      <section className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card border border-border rounded-2xl p-3.5 shadow-sm">
          <div className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">Platform revenue</div>
          <div className="text-lg font-extrabold tabular-nums mt-1" style={{ color: "var(--brand-deep)" }}>
            RM {Math.round(totals.platformFees).toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">12% effective rate</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3.5 shadow-sm">
          <div className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">Pending collection</div>
          <div className="text-lg font-extrabold tabular-nums mt-1 text-amber-700">
            RM {Math.round(pendingSum).toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">PENDING + SENT</div>
        </div>
      </section>

      {/* Breakdown row */}
      <section className="grid grid-cols-4 gap-2 mb-5">
        <KPI icon={Wallet}     label="Trainer fee" value={totals.trainerFees} tone="emerald" />
        <KPI icon={TrendingUp} label="Platform"    value={totals.platformFees} tone="violet" />
        <KPI icon={Landmark}   label="SST 8%"      value={totals.sst} tone="rose" />
        <KPI icon={Building2}  label="HRDF 1%"     value={totals.hrdf} tone="amber" />
      </section>

      <div className="flex items-baseline justify-between mb-2.5">
        <h2 className="text-sm font-bold tracking-tight">Recent invoices</h2>
        <Link href="/m/admin/invoices" className="text-[11px] font-semibold text-[var(--brand)]">
          See all →
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Receipt className="mx-auto size-8 text-muted-foreground/60 mb-2" />
          <h2 className="text-sm font-semibold">No invoices yet</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            Invoices are generated automatically when bookings are confirmed.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {invoices.slice(0, 12).map((inv) => {
            const bd = breakdown(inv);
            const issued = new Date(inv.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
            return (
              <li key={inv.id}>
                <Link
                  href={`/admin/invoices/${inv.id}`}
                  className="block bg-card border border-border rounded-2xl p-3 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full ${STATUS_TONE[inv.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {inv.status}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">{inv.invoiceNumber}</span>
                      </div>
                      <div className="text-sm font-bold truncate">{inv.booking.program.title}</div>
                      <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-0.5 truncate">
                        {inv.booking.company.name} · {issued}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold tabular-nums" style={{ color: "var(--brand-deep)" }}>
                        RM {Math.round(bd.programFee).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground">program fee</div>
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

function KPI({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: number;
  tone: "emerald" | "violet" | "rose" | "amber";
}) {
  const colorMap: Record<typeof tone, string> = {
    emerald: "text-emerald-600",
    violet:  "text-violet-600",
    rose:    "text-rose-600",
    amber:   "text-amber-600",
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-2.5 shadow-sm text-center">
      <Icon className={`mx-auto size-4 ${colorMap[tone]} mb-1`} />
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none">{label}</div>
      <div className={`text-[13px] font-extrabold tabular-nums mt-0.5 ${colorMap[tone]}`}>
        {Math.round(value).toLocaleString()}
      </div>
    </div>
  );
}
