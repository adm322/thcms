import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import { NewEmployeeForm } from "./NewEmployeeForm";

export const dynamic = "force-dynamic";

export default async function MobileHRNewEmployeePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "HR" || !session.companyId) redirect("/m");

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m/hr/employees" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back to roster
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
          HR · Roster
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Add employee</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Three quick steps. They&apos;ll be available to enroll in training programs.
        </p>
      </header>

      <NewEmployeeForm />
    </main>
  );
}
