import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "PARTICIPANT") {
      return NextResponse.json({ error: "Unauthorized. Participants only." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid feedback answers data." }, { status: 400 });
    }

    // 1. Fetch Evaluation and check if it exists and is blasted
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            participants: true
          }
        }
      }
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found." }, { status: 404 });
    }

    if (!evaluation.sentAt) {
      return NextResponse.json({ error: "Feedback form is not active yet." }, { status: 400 });
    }

    // 2. Verify current user is a participant enrolled in this booking
    const participant = evaluation.booking.participants.find(
      p => p.userId === session.id || (p.email && p.email.toLowerCase() === session.email.toLowerCase())
    );

    if (!participant) {
      return NextResponse.json({ error: "You are not enrolled in this training program." }, { status: 403 });
    }

    // 3. Check if they have already submitted
    const responsesList = evaluation.responses ? JSON.parse(evaluation.responses) : [];
    const alreadySubmitted = responsesList.some((r: any) => r.participantId === participant.id);
    if (alreadySubmitted) {
      return NextResponse.json({ error: "You have already submitted feedback for this class." }, { status: 409 });
    }

    // 4. Format and append new response
    // answers should be: [{ questionIdx: number, rating: number, comment?: string }]
    const formattedAnswers = answers.map((a: any) => ({
      questionIdx: Number(a.questionIdx),
      rating: a.rating ? Number(a.rating) : 0,
      comment: a.comment || ""
    }));

    const newResponse = {
      participantId: participant.id,
      answers: formattedAnswers
    };

    const updatedResponses = [...responsesList, newResponse];

    // 5. Recalculate average rating
    let totalRatingSum = 0;
    let totalRatingCount = 0;
    for (const resp of updatedResponses) {
      let respSum = 0;
      let respCount = 0;
      for (const ans of resp.answers) {
        if (ans.rating > 0) {
          respSum += ans.rating;
          respCount++;
        }
      }
      if (respCount > 0) {
        totalRatingSum += (respSum / respCount);
        totalRatingCount++;
      }
    }
    const newSummaryScore = totalRatingCount > 0 ? Math.round((totalRatingSum / totalRatingCount) * 10) / 10 : null;

    // 6. Save in DB
    await prisma.evaluation.update({
      where: { id },
      data: {
        responses: JSON.stringify(updatedResponses),
        summaryScore: newSummaryScore,
        completedAt: evaluation.completedAt || new Date()
      }
    });

    return NextResponse.json({ message: "Thank you! Your feedback has been submitted successfully." });
  } catch (error) {
    console.error("Evaluation submission error:", error);
    return NextResponse.json({ error: "Failed to submit evaluation. Internal Server Error." }, { status: 500 });
  }
}
