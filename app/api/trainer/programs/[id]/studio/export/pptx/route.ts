/**
 * PPTX Export Endpoint
 *
 * GET: Loads the studio's slidesJson and returns a downloadable .pptx file.
 * Auth: trainer owner, HR, or admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-guards";
import { generatePptx } from "@/lib/pptx-export";
import type { Slide } from "@/components/studio/slide-types";

export const GET = withAuth(
  "TRAINER",
  async ({ session, params }) => {
    const { id: programId } = (await params) as { id: string };

    // Find program
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { trainerId: true, title: true },
    });

    if (!program || program.trainerId !== session.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Find studio
    const studio = await prisma.learningStudio.findUnique({
      where: { programId },
    });

    if (!studio || !studio.slidesJson) {
      return NextResponse.json(
        { error: "No slides available to export. Generate slides first." },
        { status: 404 }
      );
    }

    // Parse slides
    let slides: Slide[];
    try {
      const parsed = JSON.parse(studio.slidesJson);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return NextResponse.json(
          { error: "No slides available to export." },
          { status: 404 }
        );
      }
      slides = parsed as Slide[];
    } catch {
      return NextResponse.json(
        { error: "Invalid slide data. Please regenerate slides." },
        { status: 500 }
      );
    }

    // Generate PPTX
    try {
      const buffer = await generatePptx(slides, program.title);

      // Build filename
      const safeName = program.title
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 60);
      const filename = `${safeName || "training"}_slides.pptx`;

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": String(buffer.length),
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("PPTX generation error:", msg);
      return NextResponse.json(
        { error: `Failed to generate PPTX: ${msg}` },
        { status: 500 }
      );
    }
  }
);
