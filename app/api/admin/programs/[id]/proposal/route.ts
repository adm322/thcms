import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await parseBody(request);
  if (body instanceof NextResponse) return body;

  const program = await prisma.program.update({
    where: { id },
    data: {
      proposalUrl: body.proposalUrl ?? null,
      proposalLabel: body.proposalLabel ?? null,
    },
  });

  return NextResponse.json(program);
}
