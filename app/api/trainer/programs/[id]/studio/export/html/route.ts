/**
 * Self-Contained HTML Export Endpoint
 *
 * GET: Loads the studio's slidesJson and returns a downloadable .html file
 * with all slides embedded in a self-contained presentation viewer.
 *
 * Auth: any logged-in user with access to the program (owner, HR, admin,
 *      or enrolled participant).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-guards";
import { generateHtmlBundle } from "@/lib/html-export";
import type { Slide } from "@/components/studio/slide-types";

export const GET = withAuth(
  "TRAINER",
  async ({ session, params }) => {
    const { id: programId } = (await params) as { id: string };

    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { trainerId: true, title: true },
    });

    if (!program || program.trainerId !== session.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const studio = await prisma.learningStudio.findUnique({
      where: { programId },
    });

    if (!studio || !studio.slidesJson) {
      return NextResponse.json(
        { error: "No slides available to export. Generate slides first." },
        { status: 404 }
      );
    }

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

    try {
      const html = await generateHtmlBundle(slides, program.title);

      const safeName = program.title
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 60);
      const filename = `${safeName || "training"}_slides.html`;

      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": String(Buffer.byteLength(html, "utf-8")),
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("HTML generation error:", msg);
      return NextResponse.json(
        { error: `Failed to generate HTML: ${msg}` },
        { status: 500 }
      );
    }
  }
);
