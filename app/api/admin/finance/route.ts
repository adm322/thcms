import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-guards";

/**
 * Compute the fee breakdown for an invoice.
 * Pure function — never mutates the database. Use `prisma/seed-fee-breakdown.ts`
 * (or a one-off admin script) to backfill existing invoices. Reads of an
 * invoice that has not been backfilled yet get an in-memory calculation so the
 * UI still renders.
 */
function calcBreakdown(invoice: { amount: number | null; platformFee: number | null; trainerFee: number | null; hrdfFee: number | null; sst: number | null; netPay: number | null }) {
  const amount = invoice.amount ?? 0;
  const platformFee = invoice.platformFee ?? Math.round(amount * 0.12);
  const trainerFee = invoice.trainerFee ?? amount - platformFee;
  const sst = invoice.sst ?? Math.round(platformFee * 0.08);
  const hrdfFee = invoice.hrdfFee ?? Math.round(amount * 0.01);
  const netPay = invoice.netPay ?? trainerFee - sst;

  return {
    programFee: amount,
    platformFee,
    trainerFee,
    hrdfFee,
    sst,
    netPay,
  };
}

export const GET = withAuth(
  "ADMIN",
  async () => {
    const invoices = await prisma.invoice.findMany({
      include: {
        booking: {
          select: {
            program: {
              select: {
                title: true,
                category: true,
                trainer: { select: { name: true } },
              },
            },
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    // Pure read — compute breakdown in memory; never write on GET.
    const withBreakdown = invoices.map((inv) => {
      const bd = calcBreakdown(inv);
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        companyName: inv.booking?.company?.name || "—",
        programTitle: inv.booking?.program?.title || "—",
        category: inv.booking?.program?.category || "—",
        trainerName: inv.booking?.program?.trainer?.name || "—",
        status: inv.status,
        issuedAt: inv.issuedAt.toISOString(),
        paidAt: inv.paidAt?.toISOString() ?? null,
        ...bd,
      };
    });

    // Aggregates
    const paidList = withBreakdown.filter((i) => i.status === "PAID");
    const totalProgramFees = paidList.reduce((s, i) => s + i.programFee, 0);
    const totalTrainerFees = paidList.reduce((s, i) => s + i.trainerFee, 0);
    const totalPlatformFees = paidList.reduce((s, i) => s + i.platformFee, 0);
    const totalHRDF = paidList.reduce((s, i) => s + i.hrdfFee, 0);
    const totalSST = paidList.reduce((s, i) => s + i.sst, 0);
    const totalNetPay = paidList.reduce((s, i) => s + i.netPay, 0);

    return NextResponse.json({
      invoices: withBreakdown,
      summary: {
        totalProgramFees,
        totalTrainerFees,
        totalPlatformFees,
        totalHRDF,
        totalSST,
        totalNetPay,
        paidCount: paidList.length,
        totalInvoices: invoices.length,
      },
    });
  }
);
