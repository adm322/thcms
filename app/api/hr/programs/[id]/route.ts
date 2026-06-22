import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      trainer: {
        select: {
          id: true,
          name: true,
          trainerProfile: { select: { rating: true, totalPrograms: true, bio: true, expertise: true } },
        },
      },
      modules: {
        orderBy: { orderIndex: "asc" },
        include: { _count: { select: { quizzes: true, materials: true } } },
      },
      itinerary: { orderBy: { orderIndex: "asc" } },
      _count: { select: { bookings: true } },
    },
  });

  if (!program || program.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: program.id,
    title: program.title,
    description: program.description,
    category: program.category,
    durationHours: program.durationHours,
    maxParticipants: program.maxParticipants,
    pricePerPax: program.pricePerPax,
    locationType: program.locationType,
    syllabus: JSON.parse(program.syllabus || "[]"),
    trainerName: program.trainer.name,
    trainerId: program.trainer.id,
    trainerRating: program.trainer.trainerProfile?.rating ?? 0,
    trainerBio: program.trainer.trainerProfile?.bio ?? "",
    trainerExpertise: JSON.parse(program.trainer.trainerProfile?.expertise || "[]"),
    totalBookings: program._count.bookings,
    proposalUrl: program.proposalUrl,
    proposalLabel: program.proposalLabel,
    itinerary: program.itinerary,
    modules: program.modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      durationMins: m.durationMins,
      quizCount: m._count.quizzes,
      materialCount: m._count.materials,
    })),
  });
}
