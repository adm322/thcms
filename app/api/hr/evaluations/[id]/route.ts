import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "HR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: { booking: { select: { companyId: true } } },
  });

  if (!evaluation || evaluation.booking.companyId !== session.companyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(evaluation);
}
