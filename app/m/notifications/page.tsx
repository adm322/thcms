import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Bell, BellOff, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkAllReadButton } from "./MarkAllReadButton";

export const dynamic = "force-dynamic";

function formatTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1)    return "Just now";
  if (mins < 60)   return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  if (mins < 7 * 1440) return `${Math.round(mins / 1440)} d ago`;
  return date.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

export default async function MobileNotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const notifications = await prisma.notification
    .findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    .catch(() => []);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <main className="px-4 pt-5 pb-24">
      <header className="mb-4">
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">
          Inbox
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Notifications</h1>
          <div className="text-xs text-muted-foreground">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </div>
        </div>
      </header>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <BellOff className="mx-auto size-8 text-muted-foreground/60 mb-2" />
          <h2 className="text-sm font-semibold">No notifications yet</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            We&apos;ll ping you when there&apos;s a booking update, approval, or alert.
          </p>
        </div>
      ) : (
        <>
          {unread > 0 && (
            <div className="mb-3 flex justify-end">
              <MarkAllReadButton />
            </div>
          )}
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link ?? "#"}
                  className={cn(
                    "block bg-card border border-border rounded-2xl p-3.5 active:scale-[0.99] transition-transform",
                    !n.read && "border-l-[3px] border-l-[var(--brand)]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "size-9 rounded-xl grid place-items-center shrink-0",
                        n.read ? "bg-muted text-muted-foreground" : "bg-[var(--brand-soft)] text-[var(--brand)]",
                      )}
                    >
                      <Bell className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-sm font-semibold leading-tight">{n.title}</h3>
                        {!n.read && (
                          <span className="inline-block size-2 rounded-full bg-rose-500 shrink-0 mt-1" aria-label="unread" />
                        )}
                      </div>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {n.body}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] text-muted-foreground">
                          {n.type.replace(/_/g, " ").toLowerCase()}
                        </span>
                        <time className="text-[11px] text-muted-foreground">{formatTime(n.createdAt)}</time>
                      </div>
                    </div>
                    {n.link && <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-2" />}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

