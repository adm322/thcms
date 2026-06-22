import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const invoices = await prisma.invoice.findMany({
    include: { company: { select: { name: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return NextResponse.json(
    invoices.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      companyName: i.company.name,
      amount: i.amount,
      status: i.status,
      issuedAt: i.issuedAt.toISOString(),
      dueDate: i.dueDate?.toISOString() ?? null,
      paidAt: i.paidAt?.toISOString() ?? null,
    }))
  );
}
