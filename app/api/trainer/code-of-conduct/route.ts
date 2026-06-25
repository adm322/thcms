import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const doc = await prisma.codeOfConduct.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(doc || null);
}
