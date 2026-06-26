import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trainers = await prisma.user.findMany({
    where: { role: "TRAINER" },
    include: {
      trainerProfile: true,
      _count: { select: { programs: true } },
    },
  });

  return NextResponse.json(
    trainers.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      programs: t._count.programs,
      rating: t.trainerProfile?.rating ?? 0,
      expertise: t.trainerProfile?.expertise ? JSON.parse(t.trainerProfile.expertise) : [],
    }))
  );
}
