import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  Mail, Briefcase, Building2,
  ChevronRight, Sparkles,
} from "lucide-react";

import { ViewToggle } from "./ViewToggle";
import { SignOutCard } from "./SignOutCard";

export const dynamic = "force-dynamic";

export default async function MobileProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const company = session.companyId
    ? await prisma.company
        .findUnique({ where: { id: session.companyId }, select: { name: true } })
        .catch(() => null)
    : null;

  const rolePill: Record<string, { label: string; tone: string }> = {
    ADMIN:       { label: "Platform Admin",  tone: "bg-fuchsia-100 text-fuchsia-900" },
    HR:          { label: "HR Department",   tone: "bg-orange-100 text-orange-900"   },
    TRAINER:     { label: "Training Provider", tone: "bg-emerald-100 text-emerald-900" },
    PARTICIPANT: { label: "Participant",     tone: "bg-sky-100 text-sky-900"          },
  };
  const pill = rolePill[session.role] ?? { label: session.role, tone: "bg-slate-100 text-slate-900" };

  return (
    <main className="px-4 pt-5 pb-24 space-y-5">
      <header>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
          My Profile
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">{session.name}</h1>
      </header>

      {/* Identity card */}
      <section className="bg-card border border-border rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="size-14 rounded-full grid place-items-center text-white text-lg font-bold shadow"
            style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
          >
            {(session.name || session.email).slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold truncate">{session.name}</div>
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mt-1 ${pill.tone}`}>
              {pill.label}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-2.5">
          <Row icon={<Mail className="size-4" />}        label="Email"        value={session.email} />
          {company?.name && (
            <Row icon={<Building2 className="size-4" />} label="Company"      value={company.name} />
          )}
          <Row
            icon={<Briefcase className="size-4" />}
            label="Member since"
            value={new Date().toLocaleDateString("en-MY", { year: "numeric", month: "long" })}
          />
        </div>
      </section>

      {/* Display preferences — switch dashboard layout */}
      <section>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground mb-2">
          Dashboard layout
        </div>
        <ViewToggle />
        <p className="text-[11px] text-muted-foreground mt-2 px-1">
          Mobile uses bottom dock + cards. Desktop shows the full sidebar.
        </p>
      </section>

      {/* Quick actions */}
      <section className="space-y-2">
        <Link
          href="/m/notifications"
          className="bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99] transition-transform"
        >
          <Sparkles className="size-4 text-muted-foreground" />
          <span className="flex-1 text-sm font-medium">All notifications</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </section>

      <SignOutCard />
    </main>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="size-8 rounded-lg bg-muted text-muted-foreground grid place-items-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
        <div className="text-sm truncate">{value}</div>
      </div>
    </div>
  );
}

