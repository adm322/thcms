import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";
import { validateUpload } from "@/lib/file-validation";
import { rateLimit } from "@/lib/rate-limit";

function getFileType(mime: string): string {
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "ppt";
  if (mime.includes("video")) return "video";
  if (mime.includes("word") || mime.includes("document")) return "doc";
  if (mime.includes("image")) return "image";
  return "doc";
}

export const GET = withAuth(
  "TRAINER",
  async ({ session }) => {
    const materials = await prisma.material.findMany({
      where: { module: { program: { trainerId: session.id } } },
      include: {
        module: {
          select: {
            title: true,
            program: { select: { title: true, id: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      materials.map((m) => ({
        id: m.id,
        title: m.title,
        fileUrl: m.fileUrl,
        fileType: m.fileType,
        moduleTitle: m.module.title,
        programTitle: m.module.program.title,
        programId: m.module.program.id,
        createdAt: m.createdAt.toISOString(),
      }))
    );
  }
);

export const POST = withAuth(
  "TRAINER",
  async ({ session, request }) => {
    if (!rateLimit(`material:upload:${session.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    const moduleId = formData.get("moduleId") as string | null;
    const title = (formData.get("title") as string) || file?.name || "Untitled";

    if (!file || !moduleId) {
      return NextResponse.json({ error: "file and moduleId required" }, { status: 400 });
    }

    // Verify module belongs to trainer
    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { program: { select: { trainerId: true } } },
    });
    if (!mod || mod.program.trainerId !== session.id) {
      return NextResponse.json({ error: "Module not found or access denied" }, { status: 404 });
    }

    // Magic-byte validation: reject mismatched extensions (XSS-via-upload guard)
    const fileBuffer = new Uint8Array(await file.arrayBuffer());
    const validation = validateUpload(file.name, fileBuffer);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${validation.detectedExt}`;
    const { url: fileUrl } = await uploadFile(Buffer.from(fileBuffer), safeName, file.type);
    const fileType = getFileType(file.type);

    const material = await prisma.material.create({
      data: {
        moduleId,
        title,
        fileUrl,
        fileType,
      },
    });

    return NextResponse.json(
      {
        id: material.id,
        title: material.title,
        fileUrl: material.fileUrl,
        fileType: material.fileType,
        moduleId: material.moduleId,
        createdAt: material.createdAt.toISOString(),
      },
      { status: 201 }
    );
  }
);
