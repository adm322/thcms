import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const { status, employerHrdfSubmitted, trainerHrdfSubmitted, trainerDocumentsUrl } = body as { status: string; employerHrdfSubmitted?: boolean; trainerHrdfSubmitted?: boolean; trainerDocumentsUrl?: string };
  if (!status || !["CONFIRMED", "COMPLETED", "CANCELLED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = { status };
  if (status === "CONFIRMED" && booking.depositStatus === "UNPAID") {
    data.depositStatus = "PAID";
  }
  if (employerHrdfSubmitted !== undefined) {
    data.employerHrdfSubmitted = employerHrdfSubmitted;
    if (employerHrdfSubmitted) data.employerHrdfSubmittedAt = new Date();
  }
  if (trainerHrdfSubmitted !== undefined) {
    data.trainerHrdfSubmitted = trainerHrdfSubmitted;
    if (trainerHrdfSubmitted) data.trainerHrdfSubmittedAt = new Date();
  }
  if (trainerDocumentsUrl !== undefined) data.trainerDocumentsUrl = trainerDocumentsUrl;

  const updated = await prisma.booking.update({ where: { id }, data });

  return NextResponse.json(updated);
}
