import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseBody } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("HR");
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;
  const { status } = body as Record<string, string>;
  if (!status || !["APPROVED", "REJECTED", "PAID"].includes(status)) {
    return NextResponse.json({ error: "Valid status: APPROVED, REJECTED, PAID" }, { status: 400 });
  }
  const claim = await prisma.claim.update({ where: { id }, data: { status } });
  return NextResponse.json(claim);
}
