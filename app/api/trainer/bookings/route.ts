import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search") || "";

  const where: any = {
    program: { trainerId: session.id },
  };
  if (status && status !== "ALL") {
    where.status = status;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      program: { select: { title: true, category: true, maxParticipants: true } },
      company: { select: { name: true } },
      participants: { select: { id: true } },
    },
    orderBy: { programDate: "desc" },
      take: 100,
      skip: 0
});

  let filtered = bookings;
  if (search) {
    const q = search.toLowerCase();
    filtered = bookings.filter(
      (b) =>
        b.program.title.toLowerCase().includes(q) ||
        b.company.name.toLowerCase().includes(q)
    );
  }

  const result = filtered.map((b) => ({
    id: b.id,
    programTitle: b.program.title,
    programCategory: b.program.category,
    companyName: b.company.name,
    programDate: b.programDate.toISOString(),
    status: b.status,
    totalFee: b.totalFee,
    participantCount: b.participants.length,
    maxParticipants: b.program.maxParticipants,
    createdAt: b.createdAt.toISOString(),
  }));

  return NextResponse.json(result);
}
