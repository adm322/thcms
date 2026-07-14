/**
 * /m/admin/invoices — Admin tier 3 mobile route
 *
 * Invoices list across all bookings. Brand-tinted admin purple.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  Receipt, ArrowLeft, ChevronRight, Users, Calendar,} from "lucide-react";


export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  PAID:      "bg-emerald-100 text-emerald-900",
  SENT:      "bg-amber-100  text-amber-900",
  PENDING:   "bg-slate-100  text-slate-700",
  OVERDUE:   "bg-rose-100   text-rose-900",
  CANCELLED: "bg-slate-100  text-slate-700",
};

export default async function MobileAdminInvoicesPage({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/m");

  const { status: statusFilter } = await searchParams;

  const where: Record<string, unknown> = {};
  if (statusFilter && statusFilter !== "ALL") where.status = statusFilter;

  const [invoices, statusGroups] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        company: { select: { name: true } },
        booking: {
          include: {
            program: { include: { trainer: { select: { name: true } } } },
            _count: { select: { participants: true } },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
      take: 80,
    }).catch(() => []),
    prisma.invoice.groupBy({ by: ["status"], _count: true }).catch(() => []),
  ]);

  const counts: Record<string, number> = {};
  statusGroups.forEach((g) => { counts[g.status] = g._count; });

  const totalAmount = invoices.reduce((s, i) => s + i.amount, 0);
  const paidSum     = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const pendingSum  = invoices
    .filter((i) => i.status === "PENDING" || i.status === "SENT")
    .reduce((s, i) => s + i.amount, 0);

  const filterValues = ["ALL", "PAID", "PENDING", "SENT", "OVERDUE"] as const;

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--brand)]">
          Billing
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Invoices</h1>
          <div className="text-xs text-muted-foreground">{invoices.length} total</div>
        </div>
      </header>

      {/* Stats strip — admin purple */}
      <section
        className="rounded-3xl p-5 text-white mb-5 relative overflow-hidden shadow-[0_14px_30px_-10px_rgba(139,92,246,0.4)]"
        style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
      >
        <div className="grid grid-cols-3 gap-2 relative">
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">
              RM {Math.round(totalAmount).toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Total</div>
          </div>
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">
              RM {Math.round(paidSum).toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Paid</div>
          </div>
          <div>
            <div className="text-[18px] font-extrabold leading-none tabular-nums">
              RM {Math.round(pendingSum).toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-wide opacity-85 mt-1">Pending</div>
          </div>
        </div>
      </section>

      {/* Status filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none -mx-4 px-4">
        {filterValues.map((v) => {
          const active = (statusFilter ?? "ALL") === v;
          const label =
            v === "ALL"    ? `All (${invoices.length})` :
            v === "PAID"   ? `Paid (${counts.PAID ?? 0})` :
            v === "PENDING"? `Pending (${counts.PENDING ?? 0})` :
            v === "SENT"   ? `Sent (${counts.SENT ?? 0})` :
                              `Overdue (${counts.OVERDUE ?? 0})`;
          return (
            <Link
              key={v}
              href={v === "ALL" ? "/m/admin/invoices" : `/m/admin/invoices?status=${v}`}
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

      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Receipt className="mx-auto size-8 text-muted-foreground/60 mb-2" />
          <h2 className="text-sm font-semibold">No invoices yet</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            Once bookings are confirmed, invoices appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {invoices.map((inv) => {
            const issued = new Date(inv.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            const date   = new Date(inv.booking.programDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
            return (
              <li key={inv.id}>
                <Link
                  href={`/admin/invoices/${inv.id}`}
                  className="block bg-card border border-border rounded-2xl p-3.5 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="size-10 rounded-xl grid place-items-center shrink-0"
                      style={{ backgroundColor: "var(--brand-soft)", color: "var(--brand-deep)" }}
                    >
                      <Receipt className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_TONE[inv.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {inv.status}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">{inv.invoiceNumber}</span>
                      </div>
                      <div className="text-sm font-bold leading-tight truncate">{inv.booking.program.title}</div>
                      <div className="text-[11px] text-muted-foreground inline-flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>{inv.company.name}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5"><Calendar className="size-3" /> {date}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5"><Users className="size-3" /> {inv.booking._count.participants}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold tabular-nums" style={{ color: "var(--brand-deep)" }}>
                        RM {inv.amount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground">issued {issued}</div>
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
