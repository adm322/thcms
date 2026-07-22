import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;

  const invoices = await prisma.invoice.findMany({
    include: {
      company: { select: { name: true } },
      booking: {
        include: {
          program: {
            include: {
              trainer: { select: { name: true } }
            }
          },
          _count: { select: { participants: true } }
        }
      }
    },
    orderBy: { issuedAt: "desc" },
      take: 100,
      skip: 0
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
      programTitle: i.booking.program.title,
      trainerName: i.booking.program.trainer.name,
      participantCount: i.booking._count.participants,
      venueAddress: i.booking.venueAddress || i.booking.program.locationType,
      date: i.booking.programDate.toISOString(),
    }))
  );
}
