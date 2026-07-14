import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ArrowLeft, Info } from "lucide-react";
import { NewProgramForm } from "./NewProgramForm";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "Leadership",
  "Technical",
  "Soft Skills",
  "Compliance",
  "Team Building",
  "Communication",
  "Sales",
  "Other",
];

const LOCATION_TYPES = [
  { value: "onsite", label: "On-site" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

export default async function MobileTrainerNewProgramPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TRAINER") redirect("/m");

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--brand)]">
          New Program
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Create a draft</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Save as draft now, refine modules + quizzes later from the desktop.
        </p>
      </header>

      <NewProgramForm categories={CATEGORIES} locationTypes={LOCATION_TYPES} />

      <div className="mt-6 rounded-2xl bg-muted/40 border border-border p-3.5 text-xs text-muted-foreground flex items-start gap-2">
        <Info className="size-4 mt-0.5 shrink-0" />
        <div>
          Once saved, programs start in <span className="font-semibold text-foreground">DRAFT</span> status.
          Publish them from <code className="text-foreground">/trainer/programs</code> when ready.
        </div>
      </div>
    </main>
  );
}

