import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

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
