"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  PLAN_APPROVED: "✅",
  PLAN_REJECTED: "❌",
  BOOKING_CONFIRMED: "📅",
  BOOKING_COMPLETED: "🎉",
  HRDF_DEADLINE: "🏛️",
  BOOKING_CREATED: "📋",
  MESSAGE: "💬",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    fetchNotifications();
    // ponytail: only poll when the tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    setLoading(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setLoading(false);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRead", id }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) {} }}
        className="relative rounded-lg p-2 hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-4 left-4 top-16 sm:absolute sm:top-auto sm:right-0 sm:left-auto sm:w-96 sm:mt-2 rounded-xl border bg-card shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-bold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const icon = TYPE_ICONS[n.type] || "🔔";
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-2.5 px-4 py-3 border-b last:border-b-0 hover:bg-accent/30 transition-colors",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className={cn("text-xs", !n.read && "font-semibold")}>{n.title}</p>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                      </div>
                      {n.body && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-muted-foreground">
                          {formatTime(n.createdAt)}
                        </span>
                        <div className="flex items-center gap-2">
                          {!n.read && (
                            <button onClick={() => markRead(n.id)} className="text-[9px] text-muted-foreground hover:text-foreground">
                              Read
                            </button>
                          )}
                          {n.link && (
                            <Link
                              href={n.link}
                              onClick={() => { if (!n.read) markRead(n.id); setOpen(false); }}
                              className="text-[9px] text-primary hover:underline flex items-center gap-0.5"
                            >
                              View <ArrowRight className="h-2.5 w-2.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}
