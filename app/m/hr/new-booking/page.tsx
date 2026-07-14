import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { NewBookingForm, type ProgramOption } from "./NewBookingForm";

export const dynamic = "force-dynamic";

export default async function MobileHRNewBookingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "HR" || !session.companyId) redirect("/m");

  // Pull published programs so the user picks from a real catalog.
  const programs = await prisma.program.findMany({
    where: { status: "PUBLISHED" },
    include: {
      trainer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  }).catch(() => []);

  const options: ProgramOption[] = programs.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    trainer: p.trainer?.name ?? "TBA",
    pricePerPax: p.pricePerPax,
    durationHours: p.durationHours,
    locationType: p.locationType,
  }));

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m/hr/calendar" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
          HR Booking
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">New booking request</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Three quick steps. We&apos;ll send the trainer an invite to confirm.
        </p>
      </header>

      <NewBookingForm programs={options} />
    </main>
  );
}
