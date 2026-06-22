import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: any = {};
  if (status && status !== "ALL") where.status = status;

  const requests = await prisma.teamBuildingRequest.findMany({
    where,
    include: {
      hr: { select: { name: true, email: true } },
      company: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests.map(r => ({
    id: r.id, eventName: r.eventName, hrName: r.hr.name, hrEmail: r.hr.email,
    companyName: r.company.name, hqLocation: r.hqLocation, teamSize: r.teamSize,
    activityName: r.activityName, activityCategory: r.activityCategory,
    venueName: r.venueName, venueAddress: r.venueAddress,
    startDate: r.startDate.toISOString(), isConsecutive: r.isConsecutive, batchCount: r.batchCount,
    totalCost: r.totalCost, hrdfClaimable: r.hrdfClaimable,
    status: r.status, adminNotes: r.adminNotes,
    hrdfScheme: r.hrdfScheme,
    employerHrdfSubmitted: r.employerHrdfSubmitted, employerHrdfSubmittedAt: r.employerHrdfSubmittedAt?.toISOString() || null,
    trainerHrdfSubmitted: r.trainerHrdfSubmitted, trainerHrdfSubmittedAt: r.trainerHrdfSubmittedAt?.toISOString() || null,
    trainerDocumentsUrl: r.trainerDocumentsUrl,
    invoiceUrl: r.invoiceUrl, proposalUrl: r.proposalUrl,
    createdAt: r.createdAt.toISOString(),
  })));
}
