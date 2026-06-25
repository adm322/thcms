import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
