import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const program = await prisma.program.update({
    where: { id },
    data: {
      proposalUrl: body.proposalUrl ?? null,
      proposalLabel: body.proposalLabel ?? null,
    },
  });

  return NextResponse.json(program);
}
