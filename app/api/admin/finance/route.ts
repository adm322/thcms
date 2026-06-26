import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function calcBreakdown(invoice: any) {
  const amount = invoice.amount || 0;
  const platformFee = Math.round(amount * 0.12);   // 12% platform
  const trainerFee = amount - platformFee;
  const sst = Math.round(platformFee * 0.08);       // 8% SST on platform fee
  const hrdfFee = Math.round(amount * 0.01);        // 1% HRDF levy

  return {
    programFee: amount,
    platformFee: invoice.platformFee ?? platformFee,
    trainerFee: invoice.trainerFee ?? trainerFee,
    hrdfFee: invoice.hrdfFee ?? hrdfFee,
    sst: invoice.sst ?? sst,
    netPay: invoice.netPay ?? (trainerFee - sst),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // All invoices with booking info
  const invoices = await prisma.invoice.findMany({
    include: {
      booking: { select: { program: { select: { title: true, category: true, trainer: { select: { name: true } } } }, company: { select: { name: true } } } },
    },
    orderBy: { issuedAt: "desc" },
  });

  // Update invoices with calculated breakdowns if not set
  const updates = [];
  for (const inv of invoices) {
    if (inv.platformFee == null) {
      const bd = calcBreakdown(inv);
      updates.push(
        prisma.invoice.update({
          where: { id: inv.id },
          data: { programFee: bd.programFee, trainerFee: bd.trainerFee, hrdfFee: bd.hrdfFee, platformFee: bd.platformFee, sst: bd.sst, netPay: bd.netPay },
        })
      );
      Object.assign(inv, bd);
    }
  }
  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }

  // Calculate with computed values
  const withBreakdown = invoices.map(inv => {
    const bd = inv.platformFee != null ? {
      programFee: inv.programFee || inv.amount,
      platformFee: inv.platformFee || 0,
      trainerFee: inv.trainerFee || 0,
      hrdfFee: inv.hrdfFee || 0,
      sst: inv.sst || 0,
      netPay: inv.netPay || 0,
    } : calcBreakdown(inv);

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      companyName: inv.booking?.company?.name || "—",
      programTitle: inv.booking?.program?.title || "—",
      category: inv.booking?.program?.category || "—",
      trainerName: inv.booking?.program?.trainer?.name || "—",
      status: inv.status,
      issuedAt: inv.issuedAt.toISOString(),
      paidAt: inv.paidAt?.toISOString() || null,
      ...bd,
    };
  });

  // Aggregates
  const paidList = withBreakdown.filter(i => i.status === "PAID");
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
