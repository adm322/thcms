import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TrainerAvailabilityClient } from "./TrainerAvailabilityClient";

export const dynamic = "force-dynamic";

export default async function TrainerAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TRAINER") redirect("/trainer");

  const { month: monthStr, year: yearStr } = await searchParams;
  const today = new Date();
  const month = monthStr != null ? Number(monthStr) : today.getMonth();
  const year = yearStr != null ? Number(yearStr) : today.getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Availability</h1>
        <p className="text-muted-foreground text-sm">
          Set which days you&apos;re available for training sessions
        </p>
      </div>
      <TrainerAvailabilityClient
        trainerId={session.id}
        initialMonth={month}
        initialYear={year}
      />
    </div>
  );
}
