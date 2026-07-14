import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail, Briefcase, Building2,
  Bell, Smartphone, LogOut, User,
} from "lucide-react";

import { ViewToggle } from "@/app/m/profile/ViewToggle";
import { SignOutButton } from "./SignOutButton";

export const dynamic = "force-dynamic";

export default async function DesktopProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const company = session.companyId
    ? await prisma.company
        .findUnique({ where: { id: session.companyId }, select: { name: true } })
        .catch(() => null)
    : null;

  const rolePill: Record<string, { label: string; tone: string }> = {
    ADMIN:       { label: "Platform Admin",     tone: "bg-fuchsia-100 text-fuchsia-900" },
    HR:          { label: "HR Department",      tone: "bg-orange-100 text-orange-900"   },
    TRAINER:     { label: "Training Provider",  tone: "bg-emerald-100 text-emerald-900" },
    PARTICIPANT: { label: "Participant",        tone: "bg-sky-100 text-sky-900"          },
  };
  const pill = rolePill[session.role] ?? { label: session.role, tone: "bg-slate-100 text-slate-900" };

  // Fetch user's actual createdAt from the database
  const userRecord = await prisma.user
    .findUnique({ where: { id: session.id }, select: { createdAt: true } })
    .catch(() => null);
  const memberSince = userRecord?.createdAt
    ? new Date(userRecord.createdAt).toLocaleDateString("en-MY", { year: "numeric", month: "long" })
    : null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div>
        <div className="text-xs uppercase tracking-[0.08em] font-semibold text-muted-foreground">
          My Profile
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{session.name}</h1>
      </div>

      {/* Identity card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="size-16 rounded-full grid place-items-center text-white text-xl font-bold shadow flex-shrink-0"
              style={{ backgroundImage: "linear-gradient(135deg, var(--brand, #3b82f6), var(--brand-deep, #1d4ed8))" }}
            >
              {(session.name || session.email).slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold truncate">{session.name}</div>
              <Badge className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${pill.tone}`} variant="outline">
                {pill.label}
              </Badge>
            </div>
            <SignOutButton />
          </div>

          {/* Detail rows */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Row icon={<Mail className="size-4" />} label="Email" value={session.email} />
            {company?.name && (
              <Row icon={<Building2 className="size-4" />} label="Company" value={company.name} />
            )}
            {memberSince && (
              <Row icon={<Briefcase className="size-4" />} label="Member since" value={memberSince} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Display preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dashboard layout</CardTitle>
          <CardDescription>Switch between mobile and desktop experiences</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <ViewToggle />
          <p className="text-xs text-muted-foreground mt-3">
            Mobile uses bottom dock + cards. Desktop shows the full sidebar.
          </p>
        </CardContent>
      </Card>

      {/* Quick links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick links</CardTitle>
        </CardHeader>
        <CardContent className="pb-6 space-y-2">
          <Link
            href="/notifications"
            className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
          >
            <Bell className="size-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">All notifications</span>
            <span className="text-xs text-muted-foreground">→</span>
          </Link>
          <Link
            href="/m"
            className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
          >
            <Smartphone className="size-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Mobile view</span>
            <span className="text-xs text-muted-foreground">→</span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="size-9 rounded-lg bg-muted text-muted-foreground grid place-items-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
        <div className="text-sm truncate">{value}</div>
      </div>
    </div>
  );
}
