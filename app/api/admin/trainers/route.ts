import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-guards";

export const GET = withAuth(
  "ADMIN",
  async () => {
    const trainers = await prisma.user.findMany({
      where: { role: "TRAINER" },
      include: {
        trainerProfile: true,
        _count: { select: { programs: true } },
      },
      take: 200,
        skip: 0
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
);
