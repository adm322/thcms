import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, parseBody } from "@/lib/api-utils";

export async function PATCH(request: NextRequest) {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;

  const body = await parseBody<{ ids?: string[], status?: string }>(request);
  if (body instanceof NextResponse) return body;

  const { ids, status } = body;
  if (!ids || !Array.isArray(ids) || !status) {
    return NextResponse.json({ error: "ids array and status required" }, { status: 400 });
  }

  await prisma.booking.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });

  return NextResponse.json({ updated: ids.length });
}
