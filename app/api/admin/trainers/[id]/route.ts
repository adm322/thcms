import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      trainerProfile: true,
      programs: {
        include: {
          _count: { select: { bookings: true, modules: true } },
          bookings: { select: { totalFee: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      availabilities: { where: { status: "UNAVAILABLE", date: { gte: new Date() } }, orderBy: { date: "asc" }, take: 10 },
    },
  });
  if (!user || user.role !== "TRAINER") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalBookings = user.programs.reduce((s, p) => s + p._count.bookings, 0);
  const totalRevenue = user.programs.reduce((s, p) => s + p.bookings.reduce((ss, b) => ss + b.totalFee, 0), 0);

  return NextResponse.json({
    id: user.id, name: user.name, email: user.email, createdAt: user.createdAt.toISOString(),
    profile: user.trainerProfile ? {
      bio: user.trainerProfile.bio, expertise: JSON.parse(user.trainerProfile.expertise || "[]"),
      bankName: user.trainerProfile.bankName, bankAccount: user.trainerProfile.bankAccount,
      hourlyRate: user.trainerProfile.hourlyRate, rating: user.trainerProfile.rating,
      totalPrograms: user.trainerProfile.totalPrograms,
    } : null,
    programs: user.programs.map(p => ({
      id: p.id, title: p.title, category: p.category, status: p.status,
      bookings: p._count.bookings, modules: p._count.modules,
      revenue: p.bookings.reduce((s, b) => s + b.totalFee, 0),
    })),
    stats: { totalBookings, totalRevenue },
    upcomingUnavailable: user.availabilities.map(a => ({ date: a.date.toISOString().slice(0, 10), reason: a.reason })),
  });
}
