import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

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

  const ext = file.name.includes(".") ? file.name.split(".").pop() || "pdf" : "pdf";
  const fileName = `doc-${Date.now()}-${Math.random().toString(36).slice(2,6)}.${ext}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  
  const { url } = await uploadFile(fileBuffer, fileName, file.type);

  return NextResponse.json({
    url,
    originalName: file.name,
    size: file.size,
  }, { status: 201 });
}
