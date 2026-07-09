import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-guards";
import { uploadFile } from "@/lib/storage";
import { validateUpload } from "@/lib/file-validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const POST = withAuth(
  async ({ session, request }) => {
    if (!rateLimit(`upload:${session.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    let formData: FormData;
    try { formData = await request.formData(); } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

    const fileBuffer = new Uint8Array(await file.arrayBuffer());
    const validation = validateUpload(file.name, fileBuffer);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Use the validated extension (defense in depth — never trust the caller's name)
    const safeName = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${validation.detectedExt}`;

    const { url } = await uploadFile(Buffer.from(fileBuffer), safeName, file.type);

    return NextResponse.json({
      url,
      originalName: file.name,
      size: file.size,
    }, { status: 201 });
  }
);
