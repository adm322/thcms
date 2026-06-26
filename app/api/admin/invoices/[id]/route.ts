import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      booking: {
        select: {
          programDate: true, totalFee: true, depositPaid: true, depositStatus: true, status: true,
          program: { select: { title: true, category: true, trainer: { select: { name: true, email: true } } } },
          company: { select: { name: true, address: true, state: true } },
        },
      },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const platformFee = Math.round(invoice.amount * 0.12);
  const trainerFee = invoice.amount - platformFee;
  const hrdfLevy = Math.round(invoice.amount * 0.01);
  const sst = Math.round(platformFee * 0.08);

  return NextResponse.json({
    id: invoice.id, invoiceNumber: invoice.invoiceNumber, amount: invoice.amount, status: invoice.status,
    issuedAt: invoice.issuedAt.toISOString(), dueDate: invoice.dueDate?.toISOString() || null, paidAt: invoice.paidAt?.toISOString() || null,
    booking: invoice.booking, breakdown: { platformFee, trainerFee, hrdfLevy, sst, netPay: trainerFee - hrdfLevy },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const data: any = {};
  if (body.status) data.status = body.status;
  if (body.status === "PAID") data.paidAt = new Date();

  const invoice = await prisma.invoice.update({ where: { id }, data });
  return NextResponse.json(invoice);
}
