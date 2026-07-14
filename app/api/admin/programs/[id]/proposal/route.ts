import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-guards";
import { z } from "zod";

const ProposalSchema = z.object({
  proposalUrl: z.string().url().max(2000).nullable().optional(),
  proposalLabel: z.string().max(200).nullable().optional(),
});

export const PATCH = withAuth(
  "ADMIN",
  async ({ request, params }) => {
    const { id } = params as { id: string };

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = ProposalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const program = await prisma.program.update({
      where: { id },
      data: {
        proposalUrl: parsed.data.proposalUrl ?? null,
        proposalLabel: parsed.data.proposalLabel ?? null,
      },
    });

    return NextResponse.json(program);
  }
);
