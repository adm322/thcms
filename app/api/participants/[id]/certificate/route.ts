import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const participant = await prisma.participant.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          program: { select: { title: true, trainer: { select: { name: true } } } },
        },
      },
      quizResults: true,
    },
  });

  if (!participant || participant.attendanceStatus !== "PRESENT") {
    return NextResponse.json({ error: "Certificate not available. Attendance required." }, { status: 403 });
  }

  const programQuizzesCount = await prisma.quiz.count({
    where: { module: { program: { bookings: { some: { id: participant.bookingId } } } } }
  });

  if (programQuizzesCount > 0 && participant.quizResults.length < programQuizzesCount) {
    return NextResponse.json({ error: "Certificate not available. Please complete all course checkpoint quizzes." }, { status: 403 });
  }

  const avgScore = participant.quizResults.length > 0 
    ? Math.round(participant.quizResults.reduce((sum, r) => sum + r.score, 0) / participant.quizResults.length) 
    : null;

  const date = new Date(participant.booking.programDate);

  // Generate simple HTML certificate
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Certificate</title>
<style>
  body { font-family: 'Geist', system-ui, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#fafafa; }
  .cert { width:800px; padding:60px; border:4px double #171717; text-align:center; background:white; }
  h1 { font-size:36px; font-weight:600; letter-spacing:-1px; margin:0 0 10px; }
  .name { font-size:28px; font-weight:600; margin:20px 0 10px; color:#171717; }
  .program { font-size:18px; color:#4d4d4d; margin:5px 0; }
  .trainer { font-size:16px; color:#888; margin:5px 0 30px; }
  .score { font-size:20px; font-weight:600; color:#10b981; }
  .date { font-size:14px; color:#888; margin-top:40px; }
  .brand { font-size:12px; color:#ccc; margin-top:20px; }
</style></head><body>
<div class="cert">
  <h1>Certificate of Completion</h1>
  <p style="font-size:16px;color:#4d4d4d;">This certifies that</p>
  <p class="name">${escapeHtml(participant.name)}</p>
  <p style="font-size:14px;color:#888;">has successfully completed</p>
  <p class="program">${escapeHtml(participant.booking.program.title)}</p>
  <p class="trainer">Trainer: ${escapeHtml(participant.booking.program.trainer.name)}</p>
  ${avgScore !== null ? `<p class="score">Average Quiz Score: ${avgScore}%</p>` : ""}
  <p class="date">${date.toLocaleDateString("en-MY", { day:"numeric", month:"long", year:"numeric" })}</p>
  <p class="brand">TrainHub Malaysia — HR & Training Platform</p>
</div>
</body></html>`;

  // Update certificate URL
  await prisma.participant.update({
    where: { id },
    data: { certificateUrl: `/api/participants/${id}/certificate` },
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
