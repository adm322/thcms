import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const data: any = {};
  if (body.status) data.status = body.status;
  if (body.status === "PAID") data.paidAt = new Date();

  const invoice = await prisma.invoice.update({ where: { id }, data });
  return NextResponse.json(invoice);
}
