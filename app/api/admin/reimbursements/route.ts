import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.reimbursement.findMany({
    include: {
      trainer: { select: { name: true } },
      booking: { select: { program: { select: { title: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    items.map((r) => ({
      id: r.id,
      trainerName: r.trainer.name,
      programTitle: r.booking.program.title,
      amount: r.amount,
      description: r.description,
      receiptUrl: r.receiptUrl,
      status: r.status,
      adminNotes: r.adminNotes,
    }))
  );
}
