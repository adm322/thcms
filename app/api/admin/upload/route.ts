import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { uploadFile } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const session = await requireRole("ADMIN", "TRAINER", "HR");
  if (session instanceof NextResponse) return session;

  let formData: FormData;
  try { formData = await request.formData(); } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  const ext = file.name.includes(".") ? (file.name.split(".").pop() || "pdf").toLowerCase() : "pdf";

  const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "zip"];
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: "Invalid file extension" }, { status: 400 });
  }

  const fileName = `doc-${Date.now()}-${Math.random().toString(36).slice(2,6)}.${ext}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  
  const { url } = await uploadFile(fileBuffer, fileName, file.type);

  return NextResponse.json({
    url,
    originalName: file.name,
    size: file.size,
  }, { status: 201 });
}
