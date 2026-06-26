import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { status?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { status } = body;

  try {
    const updated = await prisma.reimbursement.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to update reimbursement:", err);
    return NextResponse.json({ error: "Failed to update reimbursement" }, { status: 500 });
  }
}
