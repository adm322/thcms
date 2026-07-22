import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  Search, Users, ArrowLeft, Plus,
  Building2, ChevronRight,
} from "lucide-react";


export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  ACTIVE:      "bg-emerald-100 text-emerald-900",
  INACTIVE:    "bg-slate-100 text-slate-700",
  TERMINATED:  "bg-rose-100 text-rose-900",
  RESIGNED:    "bg-amber-100 text-amber-900",
};

const TYPE_TONE: Record<string, string> = {
  PERMANENT:  "bg-sky-100    text-sky-900",
  CONTRACT:   "bg-violet-100 text-violet-900",
  PART_TIME:  "bg-indigo-100 text-indigo-900",
  INTERN:     "bg-pink-100   text-pink-900",
  PROBATION:  "bg-fuchsia-100 text-fuchsia-900",
};

export default async function MobileHREmployeesPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "HR" || !session.companyId) redirect("/m");

  const { q } = await searchParams;
  const search = (q ?? "").trim();

  const employees = await prisma.employee.findMany({
    where: {
      companyId: session.companyId,
      ...(search
        ? {
            OR: [
              { name:       { contains: search } },
              { email:      { contains: search } },
              { department: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: 100,
      skip: 0
}).catch(() => []);

  // Aggregate by department for the eyebrow stat.
  const departments = new Set(employees.map((e) => e.department).filter(Boolean));
  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <Link href="/m" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
          HR Roster
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Employees</h1>
          <div className="text-xs text-muted-foreground">
            {activeCount} active · {departments.size} depts
          </div>
        </div>
      </header>

      {/* Search */}
      <form action="/m/hr/employees" method="GET" className="mb-3">
        <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[var(--brand)]/30">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search by name, email or department…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </form>

      {employees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Users className="mx-auto size-8 text-muted-foreground/60 mb-2" />
          <h2 className="text-sm font-semibold">{search ? "No matches" : "No employees yet"}</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            {search ? `Nothing matched “${search}”.` : "Add your first employee to start enrolling them in training."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {employees.map((e) => {
            const initials = (e.name || e.email || "?")
              .split(/\s|@/)
              .map((s) => s[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <li key={e.id}>
                <Link
                  href={`/hr/employees/${e.id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3 active:scale-[0.99] transition-transform"
                >
                  <div
                    className="size-11 rounded-full grid place-items-center text-white font-bold shrink-0"
                    style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{e.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate inline-flex items-center gap-1">
                      {e.department ? <><Building2 className="size-3" />{e.department}{e.position ? ` · ${e.position}` : ""}</> : (e.position ?? "—")}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${STATUS_TONE[e.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {e.status}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${TYPE_TONE[e.employmentType] ?? "bg-slate-100 text-slate-700"}`}>
                        {e.employmentType.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/m/hr/employees/new"
        className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-transform"
        style={{
          backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))",
          boxShadow: "0 14px 30px -10px var(--brand-deep)55",
        }}
      >
        <Plus className="size-4" />
        Add employee
      </Link>
    </main>
  );
}

