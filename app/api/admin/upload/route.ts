import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER" && session.role !== "HR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try { formData = await request.formData(); } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.name.includes(".") ? file.name.split(".").pop() || "pdf" : "pdf";
  const fileName = `doc-${Date.now()}-${Math.random().toString(36).slice(2,6)}.${ext}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, fileName), fileBuffer);

  return NextResponse.json({
    url: `/uploads/${fileName}`,
    originalName: file.name,
    size: file.size,
  }, { status: 201 });
}
