import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";

function getFileType(mime: string): string {
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "ppt";
  if (mime.includes("video")) return "video";
  if (mime.includes("word") || mime.includes("document")) return "doc";
  if (mime.includes("image")) return "image";
  return "doc";
}

export async function GET() {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;

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

export async function POST(request: NextRequest) {
  const session = await requireRole("TRAINER");
  if (session instanceof NextResponse) return session;

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

  const ext = file.name.includes(".") ? file.name.split(".").pop() || "bin" : "bin";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  
  const { url: fileUrl } = await uploadFile(fileBuffer, fileName, file.type);
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