import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-guards";
import { rateLimit } from "@/lib/rate-limit";
import { extractText } from "@/lib/file-parser";
import { chunkText } from "@/lib/chunker";
import { insertChunks } from "@/lib/vector-store";
import { minimaxChat } from "@/lib/minimax";
import { uploadFile } from "@/lib/storage";
import { validateUpload } from "@/lib/file-validation";
import {
  buildSlidePrompt,
  buildQuizPrompt,
  slidesForContentLength,
} from "@/lib/prompts";

// ─── POST — upload file & generate studio content ───────────────────────────

export const POST = withAuth(
  "TRAINER",
  async ({ session, request, params }) => {
    const { id: programId } = (await params) as { id: string };

    if (!rateLimit(`studio:upload:${session.id}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program || program.trainerId !== session.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const validation = validateUpload(file.name, fileBytes);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    if (validation.detectedExt !== "docx" && validation.detectedExt !== "pptx") {
      return NextResponse.json(
        { error: "Only DOCX or PPTX files are supported" },
        { status: 400 }
      );
    }

    // Step 1: Upload file
    const ext = file.name.split(".").pop() || "bin";
    const fileName = `studio/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const fileBuffer = Buffer.from(fileBytes);
    let sourceFileUrl: string | null = null;
    try {
      const result = await uploadFile(fileBuffer, fileName, file.type);
      sourceFileUrl = result.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("File upload error:", msg);
      return NextResponse.json({ error: `File upload failed: ${msg}` }, { status: 500 });
    }

    // Step 2: Extract text
    let sourceText: string;
    try {
      sourceText = await extractText(file);
    } catch (err) {
      console.error("Text extraction error:", err);
      sourceText = "";
    }

    if (!sourceText.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted from the file" },
        { status: 422 }
      );
    }

    // Step 3: Upsert LearningStudio record
    const studio = await prisma.learningStudio.upsert({
      where: { programId },
      create: { programId, sourceFileUrl, sourceText },
      update: {
        sourceFileUrl,
        sourceText,
        slidesJson: null,
        quizId: null,
        generatedAt: null,
        chunksEmbedded: false,
        embeddedAt: null,
      },
    });

    // Step 4: Chunk text & embed (RAG store)
    let chunksEmbedded = false;
    let embeddedAt: Date | null = null;
    try {
      const chunks = chunkText(sourceText);
      if (chunks.length > 0) {
        await prisma.rAGChunk.deleteMany({ where: { learningStudioId: studio.id } });
        await insertChunks(chunks, studio.id);
        chunksEmbedded = true;
        embeddedAt = new Date();
      }
    } catch (err) {
      console.error("Chunk embedding error:", err);
    }

    // Step 5: Generate slides
    let slidesJson: string | null = null;
    try {
      const slideCount = slidesForContentLength(sourceText.length);
      const slidePrompt = buildSlidePrompt({ text: sourceText, slideCount });
      const rawSlides = await minimaxChat(slidePrompt.user, slidePrompt.system);
      if (rawSlides) {
        const cleaned = rawSlides.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (s: unknown) =>
              s && typeof s === "object" && typeof (s as Record<string, unknown>).title === "string"
          );
          if (valid.length > 0) slidesJson = JSON.stringify(valid);
        }
      }
    } catch (err) {
      console.error("Slide generation error:", err);
    }

    // Step 6: Generate quiz
    let quizId: string | null = null;
    try {
      const quizPrompt = buildQuizPrompt(sourceText, 5);
      const rawQuiz = await minimaxChat(quizPrompt.user, quizPrompt.system);
      if (rawQuiz) {
        const cleaned = rawQuiz.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        const questions = JSON.parse(cleaned) as Array<{
          text: string;
          options: string[];
          correctIndex: number;
          explanation: string;
        }>;

        const shareToken = crypto.randomUUID();
        const quiz = await prisma.quiz.create({
          data: {
            title: `${program.title} — Auto-Generated Quiz`,
            description: `AI-generated quiz from ${file.name}`,
            passingScore: 50,
            timeLimitMins: 30,
            standalone: true,
            shareToken,
            questions: {
              create: questions.map((q, idx) => ({
                text: q.text,
                type: "MULTIPLE_CHOICE",
                options: JSON.stringify(q.options),
                correctAnswer: String(q.correctIndex),
                points: 1,
                orderIndex: idx,
              })),
            },
          },
        });
        quizId = quiz.id;
      }
    } catch (err) {
      console.error("Quiz generation error:", err);
    }

    // Step 7: Update studio record
    await prisma.learningStudio.update({
      where: { id: studio.id },
      data: {
        slidesJson,
        quizId,
        generatedAt: new Date(),
        chunksEmbedded,
        embeddedAt,
      },
    });

    return NextResponse.json({
      id: studio.id,
      slidesJson,
      quizId,
      generatedAt: new Date().toISOString(),
      sourceFileUrl,
    }, { status: 201 });
  }
);

// ─── GET — load studio content ───────────────────────────────────────────────

export const GET = withAuth(
  async ({ session, request, params }) => {
    const { id: programId } = (await params) as { id: string };

    const studio = await prisma.learningStudio.findUnique({
      where: { programId },
    });

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 });
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { trainerId: true, title: true },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const isOwner = session.role === "TRAINER" && program.trainerId === session.id;

    if (!isOwner) {
      if (session.role === "PARTICIPANT") {
        const hasBooking = await prisma.participant.findFirst({
          where: {
            booking: { programId },
            OR: [{ userId: session.id }, { email: session.email }],
          },
        });
        if (!hasBooking) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else if (session.role !== "HR" && session.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const status: "ready" | "pending" | "failed" = studio.generatedAt
      ? "ready"
      : studio.sourceText
        ? "failed"
        : "pending";

    const response: Record<string, unknown> = {
      id: studio.id,
      programTitle: program.title,
      slidesJson: studio.slidesJson,
      quizId: studio.quizId,
      generatedAt: studio.generatedAt?.toISOString() ?? null,
      status,
    };

    if (isOwner && studio.quizId) {
      const quiz = await prisma.quiz.findUnique({
        where: { id: studio.quizId },
        include: { questions: { orderBy: { orderIndex: "asc" } } },
      });
      if (quiz) {
        response.quiz = {
          id: quiz.id,
          title: quiz.title,
          questions: quiz.questions.map((q) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options,
            points: q.points,
          })),
        };
      }
    }

    return NextResponse.json(response);
  }
);

// ─── DELETE — reset studio ──────────────────────────────────────────────────

export const DELETE = withAuth(
  "TRAINER",
  async ({ session, params }) => {
    const { id: programId } = (await params) as { id: string };

    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program || program.trainerId !== session.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const studio = await prisma.learningStudio.findUnique({ where: { programId } });
    if (!studio) {
      return NextResponse.json({ error: "No studio to delete" }, { status: 404 });
    }

    await prisma.rAGChunk.deleteMany({ where: { learningStudioId: studio.id } });

    if (studio.quizId) {
      await prisma.quiz.delete({ where: { id: studio.quizId } }).catch(() => {});
    }

    await prisma.learningStudio.delete({ where: { id: studio.id } });

    return NextResponse.json({ success: true });
  }
);
