import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "HR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { status } = body;
  if (!status || !["APPROVED", "REJECTED", "PAID"].includes(status)) {
    return NextResponse.json({ error: "Valid status: APPROVED, REJECTED, PAID" }, { status: 400 });
  }
  const claim = await prisma.claim.update({ where: { id }, data: { status } });
  return NextResponse.json(claim);
}
