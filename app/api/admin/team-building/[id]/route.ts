import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status, adminNotes, invoiceUrl, proposalUrl,
    hrdfScheme, employerHrdfSubmitted, trainerHrdfSubmitted, trainerDocumentsUrl } = body;
  const data: any = {};
  if (status) data.status = status;
  if (adminNotes !== undefined) data.adminNotes = adminNotes;
  if (invoiceUrl !== undefined) data.invoiceUrl = invoiceUrl;
  if (proposalUrl !== undefined) data.proposalUrl = proposalUrl;
  if (hrdfScheme) data.hrdfScheme = hrdfScheme;
  if (employerHrdfSubmitted !== undefined) {
    data.employerHrdfSubmitted = employerHrdfSubmitted;
    if (employerHrdfSubmitted) data.employerHrdfSubmittedAt = new Date();
  }
  if (trainerHrdfSubmitted !== undefined) {
    data.trainerHrdfSubmitted = trainerHrdfSubmitted;
    if (trainerHrdfSubmitted) data.trainerHrdfSubmittedAt = new Date();
  }
  if (trainerDocumentsUrl !== undefined) data.trainerDocumentsUrl = trainerDocumentsUrl;

  const updated = await prisma.teamBuildingRequest.update({
    where: { id },
    data,
    include: { hr: { select: { name: true } }, company: { select: { name: true } } },
  });

  return NextResponse.json(updated);
}
