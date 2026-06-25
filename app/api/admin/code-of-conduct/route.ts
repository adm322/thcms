import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const docs = await prisma.codeOfConduct.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content, status } = await req.json();
  const doc = await prisma.codeOfConduct.create({ data: { title, content, status: status || "ACTIVE" } });
  return NextResponse.json(doc, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, title, content } = await req.json();
  const data: any = {};
  if (status) data.status = status;
  if (title) data.title = title;
  if (content) data.content = content;
  await prisma.codeOfConduct.update({ where: { id }, data });
  return NextResponse.json({ success: true });
}
