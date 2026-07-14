import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Bell, BellOff, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MarkAllReadButton } from "@/app/m/notifications/MarkAllReadButton";

export const dynamic = "force-dynamic";

function formatTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  if (mins < 7 * 1440) return `${Math.round(mins / 1440)} d ago`;
  return date.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

export default async function DesktopNotificationsPage() {
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
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unread > 0
              ? `${unread} unread notification${unread !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unread > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BellOff className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h2 className="text-sm font-semibold">No notifications yet</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              We'll ping you when there's a booking update, approval, or alert.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Link key={n.id} href={n.link ?? "#"} className="block group">
              <Card
                className={cn(
                  "border hover:border-slate-400 hover:shadow-sm transition-all duration-200",
                  !n.read && "border-l-[3px] border-l-blue-500",
                )}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div
                    className={cn(
                      "size-10 rounded-lg grid place-items-center shrink-0",
                      n.read
                        ? "bg-muted text-muted-foreground"
                        : "bg-blue-50 text-blue-600",
                    )}
                  >
                    <Bell className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-sm font-semibold leading-tight">
                        {n.title}
                      </h3>
                      {!n.read && (
                        <span
                          className="inline-block size-2 rounded-full bg-blue-500 shrink-0"
                          aria-label="unread"
                        />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-muted-foreground capitalize">
                        {n.type.replace(/_/g, " ").toLowerCase()}
                      </span>
                      <time className="text-[11px] text-muted-foreground">
                        {formatTime(n.createdAt)}
                      </time>
                    </div>
                  </div>
                  {n.link && (
                    <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
