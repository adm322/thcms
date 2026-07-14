import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";

import { MessagesMobileView } from "./MessagesMobileView";

export const dynamic = "force-dynamic";

export default async function MobileHRMessagesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "HR") redirect("/m");

  return (
    <main className="flex flex-col h-[calc(100dvh-3rem)]">
      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-5 pb-3">
        <Link
          href="/m"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
          HR Messages
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Messages</h1>
      </header>

      {/* Full-screen messages area */}
      <div className="flex-1 min-h-0 px-2 pb-20">
        <MessagesMobileView />
      </div>
    </main>
  );
}
