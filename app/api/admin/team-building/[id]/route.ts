import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

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
