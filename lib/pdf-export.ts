/**
 * PDF export utility for the Learning Studio.
 *
 * Renders AI-generated HTML slides as landscape PDF pages (one per slide)
 * using jspdf, following the same patterns as the certificate generator.
 */

import { jsPDF } from "jspdf";
import type { Slide, HtmlSlide } from "@/components/studio/slide-types";

// ─── Brand constants ────────────────────────────────────────────────────────

const BRAND = {
  primary: "#6366f1",
  dark: "#1e293b",
  body: "#475569",
  muted: "#94a3b8",
  light: "#f8fafc",
  white: "#ffffff",
};

// ─── HTML parsing for PDF ───────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(html: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = html.match(regex);
  return match ? stripHtml(match[1]) : "";
}

function extractListItems(html: string): string[] {
  const items: string[] = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;
  while ((match = liRegex.exec(html)) !== null) {
    const text = stripHtml(match[1]);
    if (text) items.push(text);
  }
  return items;
}

function extractParagraphs(html: string): string[] {
  const paragraphs: string[] = [];
  const cleaned = html
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, "")
    .replace(/<li[^>]*>[\s\S]*?<\/li>/gi, "")
    .replace(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi, "")
    .replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi, "");
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pRegex.exec(cleaned)) !== null) {
    const text = stripHtml(match[1]);
    if (text) paragraphs.push(text);
  }
  return paragraphs;
}

interface PdfSlideContent {
  title: string;
  bullets: string[];
  quote: string;
  paragraphs: string[];
}

function parseSlideForPdf(html: string): PdfSlideContent {
  return {
    title: extractTag(html, "h1") || extractTag(html, "h2"),
    bullets: extractListItems(html),
    quote: extractTag(html, "blockquote"),
    paragraphs: extractParagraphs(html),
  };
}

// ─── Text wrapping helper ───────────────────────────────────────────────────

function wrapText(
  doc: jsPDF,
  text: string,
  maxWidth: number
): string[] {
  // jspdf's splitTextToSize can handle basic wrapping
  return doc.splitTextToSize(text, maxWidth) as unknown as string[];
}

// ─── PDF generation ─────────────────────────────────────────────────────────

/**
 * Generate a PDF buffer from an array of slides.
 * Each slide becomes one landscape A4 page with branded chrome.
 */
export async function generatePdf(
  slides: Slide[],
  programTitle: string = "Training Presentation"
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageW = 297;
  const pageH = 210;
  const margin = 15;

  for (let i = 0; i < slides.length; i++) {
    if (i > 0) {
      doc.addPage();
    }

    const slide = slides[i];
    const html = (slide as HtmlSlide).html ?? "";
    const parsed = parseSlideForPdf(html);

    // ── Page background ──────────────────────────────────────────────────
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, "F");

    // ── Top accent bar ───────────────────────────────────────────────────
    doc.setFillColor(99, 102, 241); // indigo-500
    doc.rect(0, 0, pageW, 4, "F");

    // ── Bottom accent bar ────────────────────────────────────────────────
    doc.rect(0, pageH - 2, pageW, 2, "F");

    // ── Brand header ─────────────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("TrainHub Studio", margin, 10);

    // ── Slide number ─────────────────────────────────────────────────────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${i + 1} / ${slides.length}`,
      pageW - margin,
      10,
      { align: "right" }
    );

    // ── Content area ─────────────────────────────────────────────────────
    const contentX = margin + 5;
    const contentW = pageW - (margin + 5) * 2;
    let yPos = 25;

    // Title
    if (parsed.title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(99, 102, 241); // indigo
      const titleLines = wrapText(doc, parsed.title, contentW);
      doc.text(titleLines, contentX, yPos);
      yPos += titleLines.length * 10 + 10;

      // Accent line under title
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.6);
      doc.line(contentX, yPos - 5, contentX + 40, yPos - 5);
    }

    // Quote
    if (parsed.quote) {
      // Accent bar
      doc.setFillColor(99, 102, 241);
      doc.rect(contentX, yPos, 2, 40, "F");

      doc.setFont("helvetica", "italic");
      doc.setFontSize(14);
      doc.setTextColor(71, 85, 105); // slate-600
      const quoteLines = wrapText(doc, parsed.quote, contentW - 10);
      doc.text(quoteLines, contentX + 8, yPos + 8);
      yPos += 55;
    }

    // Bullets
    if (parsed.bullets.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59); // slate-800

      for (let bi = 0; bi < parsed.bullets.length; bi++) {
        if (yPos > pageH - margin - 10) break; // prevent overflow

        const bulletText = `${bi + 1}.  ${parsed.bullets[bi]}`;
        const lines = wrapText(doc, bulletText, contentW - 5);
        doc.text(lines, contentX + 5, yPos);
        yPos += lines.length * 7 + 5;
      }

      yPos += 5;
    }

    // Paragraphs (for slides without bullets/quote)
    if (parsed.bullets.length === 0 && !parsed.quote && parsed.paragraphs.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);

      for (const para of parsed.paragraphs) {
        if (yPos > pageH - margin - 10) break;
        const lines = wrapText(doc, para, contentW);
        doc.text(lines, contentX + 5, yPos);
        yPos += lines.length * 7 + 8;
      }
    }

    // ── Footer brand ─────────────────────────────────────────────────────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text("Generated by TrainHub Studio", pageW / 2, pageH - 5, {
      align: "center",
    });
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
