import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";

import { EvaluationsClient } from "./EvaluationsClient";

export const dynamic = "force-dynamic";

export default async function MobileHREvaluationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "HR" || !session.companyId) redirect("/m");

  return (
    <main className="px-4 pt-5 pb-24 space-y-5">
      <header>
        <Link
          href="/m"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
          HR Evaluations
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Evaluations</h1>
      </header>

      <EvaluationsClient />
    </main>
  );
}
