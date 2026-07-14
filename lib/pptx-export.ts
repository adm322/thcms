/**
 * PPTX export utility for the Learning Studio.
 *
 * Parses AI-generated HTML slides and converts them to native PPTX
 * slides using pptxgenjs. Handles common slide patterns:
 * title slides, bullet lists, two-column layouts, tables, quotes,
 * and generic content slides.
 */

import PptxGenJS from "pptxgenjs";
import type { Slide, HtmlSlide } from "@/components/studio/slide-types";

// ─── Brand constants ────────────────────────────────────────────────────────

const BRAND = {
  primary: "6366f1",
  dark: "1e293b",
  body: "475569",
  muted: "94a3b8",
  light: "f8fafc",
  accent: "4f46e5",
  white: "FFFFFF",
  red: "dc2626",
  redBg: "fef2f2",
  redText: "7f1d1d",
  green: "16a34a",
  greenBg: "f0fdf4",
  greenText: "14532d",
};

// ─── HTML parsing helpers ───────────────────────────────────────────────────

interface ParsedSlide {
  title: string;
  bullets: string[];
  leftHeading: string;
  leftBullets: string[];
  rightHeading: string;
  rightBullets: string[];
  quote: string;
  attribution: string;
  tableHeaders: string[];
  tableRows: string[][];
  paragraphs: string[];
  isTitleSlide: boolean;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
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

function extractTable(html: string): { headers: string[]; rows: string[][] } {
  const headers: string[] = [];
  const rows: string[][] = [];

  const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
  let match: RegExpExecArray | null;
  while ((match = thRegex.exec(html)) !== null) {
    headers.push(stripHtml(match[1]));
  }

  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  while ((match = trRegex.exec(html)) !== null) {
    const rowContent = match[1];
    if (/<th/i.test(rowContent)) continue;
    const cells: string[] = [];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
      cells.push(stripHtml(tdMatch[1]));
    }
    if (cells.length > 0) rows.push(cells);
  }
  return { headers, rows };
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

function isTitleSlide(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes("trainhub studio") ||
    (lower.includes("text-align:center") &&
      lower.includes("gradient"))
  );
}

function parseSlideHtml(html: string): ParsedSlide {
  const title = extractTag(html, "h1");
  const bullets = extractListItems(html);
  const quote = extractTag(html, "blockquote");
  const paragraphs = extractParagraphs(html);
  const { headers, rows } = extractTable(html);

  let leftHeading = "";
  let leftBullets: string[] = [];
  let rightHeading = "";
  let rightBullets: string[] = [];

  const gridMatch = html.match(
    /<div[^>]*style\s*=\s*"[^"]*grid[^"]*1fr\s+1fr[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  );
  if (gridMatch) {
    const colDivs = gridMatch[1].match(
      /<div[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*>([\s\S]*?)<\/div>/i
    );
    if (colDivs) {
      leftHeading = extractTag(colDivs[1], "h2");
      leftBullets = extractListItems(colDivs[1]);
      rightHeading = extractTag(colDivs[2], "h2");
      rightBullets = extractListItems(colDivs[2]);
    }
  }

  return {
    title,
    bullets,
    leftHeading,
    leftBullets,
    rightHeading,
    rightBullets,
    quote,
    attribution: extractTag(html, "p"),
    tableHeaders: headers,
    tableRows: rows,
    paragraphs,
    isTitleSlide: isTitleSlide(html),
  };
}

// ─── PPTX generation ────────────────────────────────────────────────────────

/**
 * Generate a .pptx buffer from an array of slides.
 */
export async function generatePptx(
  slides: Slide[],
  programTitle: string = "Training Presentation"
): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pptx = new (PptxGenJS as any)() as any;

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "TrainHub Studio";
  pptx.title = programTitle;
  pptx.subject = programTitle;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const html = (slide as HtmlSlide).html ?? "";
    const parsed = parseSlideHtml(html);
    const s = pptx.addSlide();

    addSlideChrome(s, i + 1, slides.length);
    renderSlideContent(s, parsed, programTitle);
  }

  const arrayBuffer = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(arrayBuffer);
}

// ─── Slide chrome (brand bars, footer, slide number) ────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addSlideChrome(s: any, num: number, total: number) {
  const W = 13.33;
  // Top accent bar
  s.addShape("rect", {
    x: 0, y: 0, w: W, h: 0.07,
    fill: { color: BRAND.primary },
  });
  // Bottom accent bar
  s.addShape("rect", {
    x: 0, y: 7.43, w: W, h: 0.07,
    fill: { color: BRAND.primary },
  });
  // Footer: brand
  s.addText("TrainHub Studio", {
    x: 0.5, y: 7.05, w: 2, h: 0.35,
    fontSize: 8, color: BRAND.muted, bold: true,
    fontFace: "Arial",
  });
  // Footer: slide number
  s.addText(`${num} / ${total}`, {
    x: 11.5, y: 7.05, w: 1.5, h: 0.35,
    fontSize: 9, color: BRAND.muted, align: "right",
    fontFace: "Arial",
  });
}

// ─── Content renderers ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderSlideContent(s: any, p: ParsedSlide, programTitle: string) {
  if (p.isTitleSlide && p.title) {
    renderTitleSlide(s, p, programTitle);
  } else if (p.leftHeading && p.rightHeading) {
    renderCompareSlide(s, p);
  } else if (p.quote && p.bullets.length === 0 && !p.title) {
    renderQuoteSlide(s, p);
  } else if (p.tableHeaders.length > 0) {
    renderTableSlide(s, p);
  } else if (p.bullets.length > 0) {
    renderBulletsSlide(s, p);
  } else if (p.title) {
    renderTextSlide(s, p);
  } else {
    renderParagraphsSlide(s, p);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderTitleSlide(s: any, p: ParsedSlide, programTitle: string) {
  const title = p.title || programTitle;

  s.addText("TrainHub Studio", {
    x: 1, y: 2.0, w: 4, h: 0.5,
    fontSize: 12, color: BRAND.primary, bold: true,
    fontFace: "Arial",
  });

  // Accent line
  s.addShape("rect", {
    x: 1, y: 2.55, w: 2, h: 0.04,
    fill: { color: BRAND.primary },
  });

  s.addText(title, {
    x: 1, y: 2.7, w: 11, h: 1.8,
    fontSize: 36, color: BRAND.dark, bold: true,
    fontFace: "Arial", valign: "middle",
  });

  if (p.paragraphs.length > 0) {
    s.addText(p.paragraphs[0], {
      x: 1, y: 4.5, w: 10, h: 0.8,
      fontSize: 16, color: BRAND.body,
      fontFace: "Arial",
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderBulletsSlide(s: any, p: ParsedSlide) {
  let yPos = 1.2;

  if (p.title) {
    s.addText(p.title, {
      x: 1, y: yPos, w: 11, h: 0.8,
      fontSize: 24, color: BRAND.primary, bold: true,
      fontFace: "Arial",
    });
    yPos += 1.0;
  }

  const items = p.bullets.map((b: string, idx: number) => ({
    text: b,
    options: {
      bullet: { type: "number", startAt: idx + 1 },
      fontSize: 15, color: BRAND.dark,
      fontFace: "Arial", lineSpacing: 30,
    },
  }));

  s.addText(items, {
    x: 1.2, y: yPos, w: 11, h: 5.5 - yPos,
    valign: "top",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderCompareSlide(s: any, p: ParsedSlide) {
  let yPos = 1.0;

  if (p.title) {
    s.addText(p.title, {
      x: 1, y: yPos, w: 11, h: 0.7,
      fontSize: 22, color: BRAND.primary, bold: true,
      fontFace: "Arial",
    });
    yPos += 0.85;
  }

  const colW = 5.5;
  const colH = 5.2 - yPos;
  const leftX = 0.8;
  const rightX = leftX + colW + 0.5;

  // Left column
  s.addShape("rect", {
    x: leftX, y: yPos, w: colW, h: colH,
    fill: { color: BRAND.redBg }, rectRadius: 0.15,
  });
  if (p.leftHeading) {
    s.addText(p.leftHeading, {
      x: leftX + 0.3, y: yPos + 0.2, w: colW - 0.6, h: 0.5,
      fontSize: 16, color: BRAND.red, bold: true, fontFace: "Arial",
    });
  }
  if (p.leftBullets.length > 0) {
    s.addText(
      p.leftBullets.map((b: string) => ({
        text: b,
        options: { bullet: true, fontSize: 13, color: BRAND.redText, fontFace: "Arial", lineSpacing: 22 },
      })),
      { x: leftX + 0.5, y: yPos + 0.8, w: colW - 0.8, h: colH - 1.0 }
    );
  }

  // Right column
  s.addShape("rect", {
    x: rightX, y: yPos, w: colW, h: colH,
    fill: { color: BRAND.greenBg }, rectRadius: 0.15,
  });
  if (p.rightHeading) {
    s.addText(p.rightHeading, {
      x: rightX + 0.3, y: yPos + 0.2, w: colW - 0.6, h: 0.5,
      fontSize: 16, color: BRAND.green, bold: true, fontFace: "Arial",
    });
  }
  if (p.rightBullets.length > 0) {
    s.addText(
      p.rightBullets.map((b: string) => ({
        text: b,
        options: { bullet: true, fontSize: 13, color: BRAND.greenText, fontFace: "Arial", lineSpacing: 22 },
      })),
      { x: rightX + 0.5, y: yPos + 0.8, w: colW - 0.8, h: colH - 1.0 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderQuoteSlide(s: any, p: ParsedSlide) {
  s.addShape("rect", {
    x: 2.5, y: 2.2, w: 0.06, h: 2.5,
    fill: { color: BRAND.primary },
  });

  s.addText(p.quote, {
    x: 3, y: 2.2, w: 7.5, h: 2.0,
    fontSize: 20, color: BRAND.body, italic: true,
    fontFace: "Arial", valign: "middle",
  });

  if (p.paragraphs.length > 0) {
    s.addText(`\u2014 ${p.paragraphs[0]}`, {
      x: 3, y: 4.3, w: 7.5, h: 0.5,
      fontSize: 14, color: BRAND.muted, align: "right",
      fontFace: "Arial",
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderTableSlide(s: any, p: ParsedSlide) {
  let yPos = 1.0;

  if (p.title) {
    s.addText(p.title, {
      x: 1, y: yPos, w: 11, h: 0.7,
      fontSize: 22, color: BRAND.primary, bold: true,
      fontFace: "Arial",
    });
    yPos += 0.9;
  }

  const allRows = [
    p.tableHeaders.map((h: string) => ({
      text: h,
      options: {
        bold: true, color: BRAND.dark,
        fill: { color: BRAND.light },
        fontSize: 13, fontFace: "Arial", align: "left",
      },
    })),
    ...p.tableRows.map((row: string[]) =>
      row.map((cell: string) => ({
        text: cell,
        options: { fontSize: 13, color: BRAND.body, fontFace: "Arial" },
      }))
    ),
  ];

  const tableHeight = Math.min(allRows.length * 0.45, 5.0);
  const colCount = p.tableHeaders.length || 1;

  s.addTable(allRows, {
    x: 1, y: yPos, w: 11, h: tableHeight,
    border: { type: "solid", pt: 0.5, color: "e2e8f0" },
    colW: Array(colCount).fill(11 / colCount),
    autoPage: false,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderTextSlide(s: any, p: ParsedSlide) {
  let yPos = 1.2;

  if (p.title) {
    s.addText(p.title, {
      x: 1, y: yPos, w: 11, h: 0.8,
      fontSize: 24, color: BRAND.primary, bold: true,
      fontFace: "Arial",
    });
    yPos += 1.0;
  }

  if (p.paragraphs.length > 0) {
    s.addText(
      p.paragraphs.map((txt: string) => ({
        text: txt,
        options: { fontSize: 16, color: BRAND.body, fontFace: "Arial", lineSpacing: 28, paraSpaceAfter: 12 },
      })),
      { x: 1.2, y: yPos, w: 11, h: 5.5 - yPos, valign: "top" }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderParagraphsSlide(s: any, p: ParsedSlide) {
  if (p.paragraphs.length > 0) {
    s.addText(
      p.paragraphs.map((txt: string) => ({
        text: txt,
        options: { fontSize: 16, color: BRAND.body, fontFace: "Arial", lineSpacing: 28, paraSpaceAfter: 12 },
      })),
      { x: 1.2, y: 1.2, w: 11, h: 5.5, valign: "middle" }
    );
  }
}
