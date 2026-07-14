import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;

  const docs = await prisma.codeOfConduct.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;

  const { title, content, status } = await req.json();
  const doc = await prisma.codeOfConduct.create({ data: { title, content, status: status || "ACTIVE" } });
  return NextResponse.json(doc, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id, status, title, content } = await req.json();
  const data: any = {};
  if (status) data.status = status;
  if (title) data.title = title;
  if (content) data.content = content;
  await prisma.codeOfConduct.update({ where: { id }, data });
  return NextResponse.json({ success: true });
}
