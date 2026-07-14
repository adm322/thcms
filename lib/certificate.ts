/**
 * Certificate generation utility.
 *
 * Generates a landscape PDF certificate using jspdf when a participant
 * has PRESENT attendance and has passed all program quizzes.
 */

import { jsPDF } from "jspdf";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate a PDF certificate for a participant who has completed a program.
 *
 * @returns The public URL path to the generated certificate PDF.
 */
export async function generateCertificate(participantId: string): Promise<string | null> {
  try {
    // 1. Fetch participant with all required relations
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        booking: {
          include: {
            program: {
              include: {
                trainer: { select: { name: true } },
                modules: { include: { quizzes: true } },
              },
            },
          },
        },
        quizResults: true,
      },
    });

    if (!participant) {
      throw new Error(`Participant ${participantId} not found`);
    }

    const { booking } = participant;
    const program = booking?.program;

    if (!program) {
      throw new Error(`No program associated with participant ${participantId}`);
    }

    const participantName = participant.name;
    const programTitle = program.title;
    const trainerName = program.trainer?.name ?? "TrainHub Trainer";
    const completionDate = new Date().toLocaleDateString("en-MY", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // 2. Calculate average quiz score
    const avgScore =
      participant.quizResults.length > 0
        ? Math.round(
            participant.quizResults.reduce((sum, r) => sum + r.score, 0) /
              participant.quizResults.length,
          )
        : null;

    // 3. Generate PDF
    const pdfBuffer = buildCertificatePDF({
      participantName,
      programTitle,
      trainerName,
      completionDate,
      avgScore,
    });

    // 4. Save to public/certificates/
    const outDir = path.join(process.cwd(), "public", "certificates");
    await mkdir(outDir, { recursive: true });

    const fileName = `${participantId}.pdf`;
    const filePath = path.join(outDir, fileName);
    await writeFile(filePath, pdfBuffer);

    return `/certificates/${fileName}`;
  } catch (err) {
    console.error("Certificate generation failed:", err);
    return null;
  }
}

// ─── PDF Layout ──────────────────────────────────────────────────────────────

interface CertificateData {
  participantName: string;
  programTitle: string;
  trainerName: string;
  completionDate: string;
  avgScore: number | null;
}

function buildCertificatePDF(data: CertificateData): Buffer {
  const { participantName, programTitle, trainerName, completionDate, avgScore } = data;

  // Landscape A4: 297mm × 210mm
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageW = 297;
  const pageH = 210;

  // ── Background ──────────────────────────────────────────────────────────
  // Off-white background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");

  // ── Outer decorative border ─────────────────────────────────────────────
  const margin = 10;
  doc.setDrawColor(23, 23, 23); // neutral-900
  doc.setLineWidth(0.6);
  doc.rect(margin, margin, pageW - margin * 2, pageH - margin * 2);

  // Inner thin border
  const innerMargin = margin + 3;
  doc.setDrawColor(140, 140, 140);
  doc.setLineWidth(0.2);
  doc.rect(innerMargin, innerMargin, pageW - innerMargin * 2, pageH - innerMargin * 2);

  // ── Top accent bar ──────────────────────────────────────────────────────
  doc.setFillColor(23, 23, 23);
  doc.rect(margin, margin, pageW - margin * 2, 5, "F");

  // ── Brand header ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text("TrainHub", pageW / 2, 32, { align: "center" });

  // ── Certificate heading ─────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(23, 23, 23);
  doc.text("Certificate of Completion", pageW / 2, 52, { align: "center" });

  // ── Decorative line under heading ────────────────────────────────────────
  doc.setDrawColor(23, 23, 23);
  doc.setLineWidth(0.8);
  const lineY = 57;
  doc.line(pageW / 2 - 40, lineY, pageW / 2 + 40, lineY);

  // ── Subtitle ────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text("This certifies that", pageW / 2, 68, { align: "center" });

  // ── Participant name ─────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(23, 23, 23);
  doc.text(participantName, pageW / 2, 82, { align: "center" });

  // ── Name underline ──────────────────────────────────────────────────────
  doc.setDrawColor(23, 23, 23);
  doc.setLineWidth(0.5);
  const nameW = Math.min(doc.getTextWidth(participantName) + 20, 160);
  doc.line(pageW / 2 - nameW / 2, 87, pageW / 2 + nameW / 2, 87);

  // ── Program detail ──────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text("has successfully completed the training program", pageW / 2, 100, { align: "center" });

  // ── Program title ───────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(23, 23, 23);
  doc.text(programTitle, pageW / 2, 112, { align: "center" });

  // ── Trainer ─────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Trainer: ${trainerName}`, pageW / 2, 127, { align: "center" });

  // ── Quiz score (if available) ────────────────────────────────────────────
  if (avgScore !== null) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(`Average Quiz Score: ${avgScore}%`, pageW / 2, 143, { align: "center" });
  }

  // ── Date ────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text(`Completed on ${completionDate}`, pageW / 2, 158, { align: "center" });

  // ── Bottom accent bar ───────────────────────────────────────────────────
  doc.setFillColor(23, 23, 23);
  doc.rect(margin, pageH - margin - 5, pageW - margin * 2, 5, "F");

  // ── Footer brand ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("TrainHub Malaysia — HR & Training Platform", pageW / 2, pageH - margin - 8, {
    align: "center",
  });

  // ── Output ──────────────────────────────────────────────────────────────
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
