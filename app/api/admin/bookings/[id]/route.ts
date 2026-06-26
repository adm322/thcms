import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      program: { select: { title: true, trainer: { select: { name: true } } } },
      company: { select: { name: true } },
      participants: {
        include: {
          quizResults: true
        }
      },
      invoices: true,
      reimbursements: true,
      evaluations: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: booking.id,
    programTitle: booking.program.title,
    trainerName: booking.program.trainer.name,
    companyName: booking.company.name,
    date: booking.programDate.toISOString(),
    status: booking.status,
    meetingLink: booking.meetingLink,
    totalFee: booking.totalFee,
    depositPaid: booking.depositPaid,
    depositStatus: booking.depositStatus,
    hrdfScheme: booking.hrdfScheme,
    employerHrdfSubmitted: booking.employerHrdfSubmitted,
    employerHrdfSubmittedAt: booking.employerHrdfSubmittedAt?.toISOString() || null,
    trainerHrdfSubmitted: booking.trainerHrdfSubmitted,
    trainerHrdfSubmittedAt: booking.trainerHrdfSubmittedAt?.toISOString() || null,
    trainerDocumentsUrl: booking.trainerDocumentsUrl,
    participants: booking.participants.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      department: p.department,
      attendanceStatus: p.attendanceStatus,
      quizScore: p.quizResults.length > 0 ? Math.round(p.quizResults.reduce((sum, r) => sum + r.score, 0) / p.quizResults.length) : null,
    })),
    invoices: booking.invoices.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      amount: i.amount,
      status: i.status,
    })),
    reimbursements: booking.reimbursements,
    evaluations: booking.evaluations,
  });
}
