"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  X,
  CheckCheck,
  ArrowRight,
  AlertTriangle,
  Clock,
  Sparkles,
  Calendar,
  Landmark,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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

interface Action {
  type: string;
  urgency: "critical" | "urgent" | "soon" | "info";
  bookingId?: string;
  programTitle?: string;
  programDate?: string;
  daysSinceCompletion?: number;
  deadlineDays?: number;
  daysUntil?: number;
  pendingDays?: number;
  message: string;
  action: string | null;
  link: string | null;
}

interface ActionsResponse {
  actions?: Action[];
  // summary shape varies by role (HR/Admin/Trainer) — keep loose
  summary?: Record<string, number>;
}

type Role = "HR" | "ADMIN" | "TRAINER" | "PARTICIPANT" | string | undefined;

interface NotificationBellProps {
  role?: Role;
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

type TabId = "all" | "actions" | "bookings" | "plans" | "messages";

interface Tab {
  id: TabId;
  label: string;
  show: boolean;
  filter: (n: UnifiedItem) => boolean;
}

// Unified view item — every row in the list is one of these.
type UnifiedItem =
  | { kind: "notification"; data: NotificationItem }
  | { kind: "action"; data: Action };

const TABS: Tab[] = [
  { id: "all", label: "All", show: true, filter: () => true },
  { id: "actions", label: "Actions", show: true, filter: (n) => n.kind === "action" },
  { id: "bookings", label: "Bookings", show: true, filter: (n) => n.kind === "notification" && ["BOOKING_CONFIRMED", "BOOKING_COMPLETED", "BOOKING_CREATED"].includes(n.data.type) },
  { id: "plans", label: "Plans", show: true, filter: (n) => n.kind === "notification" && ["PLAN_APPROVED", "PLAN_REJECTED"].includes(n.data.type) },
  { id: "messages", label: "Messages", show: true, filter: (n) => n.kind === "notification" && n.data.type === "MESSAGE" },
];

const ACTIONS_SUPPORTED: Role[] = ["HR", "ADMIN", "TRAINER"];

function actionsApiPath(role: Role): string | null {
  if (role === "HR") return "/api/hr/actions";
  if (role === "ADMIN") return "/api/admin/actions";
  if (role === "TRAINER") return "/api/trainer/actions";
  return null;
}

const urgencyChip: Record<Action["urgency"], { bg: string; color: string; iconClass: string; label: string }> = {
  critical: { bg: "bg-red-100 dark:bg-red-950/30", color: "text-red-700 dark:text-red-400", iconClass: "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400", label: "critical" },
  urgent: { bg: "bg-amber-100 dark:bg-amber-950/30", color: "text-amber-700 dark:text-amber-400", iconClass: "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400", label: "urgent" },
  soon: { bg: "bg-blue-100 dark:bg-blue-950/30", color: "text-blue-700 dark:text-blue-400", iconClass: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400", label: "soon" },
  info: { bg: "bg-muted", color: "text-muted-foreground", iconClass: "bg-muted text-muted-foreground", label: "info" },
};

export function NotificationBell({ role }: NotificationBellProps = {}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const [hasAutoOpenedCritical, setHasAutoOpenedCritical] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const actionsEnabled = !!role && ACTIONS_SUPPORTED.includes(role);
  const actionsPath = actionsApiPath(role);

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

  async function fetchActions() {
    if (!actionsEnabled || !actionsPath) return;
    try {
      const res = await fetch(actionsPath);
      if (res.ok) {
        const data: ActionsResponse = await res.json();
        setActions(data.actions || []);
        setSummary(data.summary || null);
      }
    } catch (e) { console.error(e); }
  }

  async function refreshAll() {
    await Promise.all([fetchNotifications(), fetchActions()]);
  }

  useEffect(() => {
    refreshAll();
    // ponytail: only poll when the tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refreshAll();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionsPath]);

  // Auto-open dropdown when a critical action appears (once per session)
  useEffect(() => {
    if (hasAutoOpenedCritical) return;
    if (actions.some((a) => a.urgency === "critical")) {
      setOpen(true);
      setActiveTab("actions");
      setHasAutoOpenedCritical(true);
    }
  }, [actions, hasAutoOpenedCritical]);

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

  async function handleRemind(bookingId: string) {
    await fetch("/api/admin/remind-hrdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
  }

  // Combined badge: unread notifications + critical actions
  const criticalCount = actions.filter((a) => a.urgency === "critical").length;
  const totalBadge = unreadCount + criticalCount;

  // Unified list per tab
  const unifiedAll: UnifiedItem[] = [
    ...actions.map((a) => ({ kind: "action" as const, data: a })),
    ...notifications.map((n) => ({ kind: "notification" as const, data: n })),
  ];

  const visibleTabs = TABS.filter((t) => {
    if (t.id === "actions" && !actionsEnabled) return false;
    return t.show;
  });

  const tabCounts = (tab: Tab): number => {
    if (tab.id === "all") return unifiedAll.length;
    if (tab.id === "actions") return actions.length;
    return unifiedAll.filter(tab.filter).length;
  };

  function renderActionItem(a: Action, key: React.Key) {
    const cfg = urgencyChip[a.urgency];
    const Icon = a.urgency === "critical" || a.urgency === "urgent" ? AlertTriangle : Clock;
    const progress =
      a.type === "hrdf_claim" && a.deadlineDays !== undefined
        ? {
            cls: a.deadlineDays <= 30 ? "red" : a.deadlineDays <= 90 ? "amber" : "emerald",
            pct: Math.max(3, Math.min(100, (a.deadlineDays / 180) * 100)),
          }
        : null;

    return (
      <div key={key} className="flex gap-3 group">
        <div className={cn("flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full", cfg.iconClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground/80 leading-relaxed">{a.message}</p>
          {progress && (
            <div className={cn(
              "mt-1.5 h-1 w-full rounded-full overflow-hidden",
              progress.cls === "red" ? "bg-red-100 dark:bg-red-950/40" : progress.cls === "amber" ? "bg-amber-100 dark:bg-amber-950/40" : "bg-emerald-100 dark:bg-emerald-950/40"
            )}>
              <div className={cn(
                "h-full rounded-full",
                progress.cls === "red" ? "bg-red-500" : progress.cls === "amber" ? "bg-amber-500" : "bg-emerald-500"
              )} style={{ width: `${progress.pct}%` }} />
            </div>
          )}
          {a.link && a.action && (
            a.action === "Remind HR" && a.bookingId ? (
              <button
                onClick={async () => { await handleRemind(a.bookingId!); }}
                className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-primary hover:underline"
              >
                {a.action} <ArrowRight className="h-3 w-3" />
              </button>
            ) : (
              <Link
                href={a.link}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-primary hover:underline"
              >
                {a.action} <ArrowRight className="h-3 w-3" />
              </Link>
            )
          )}
        </div>
      </div>
    );
  }

  function renderNotificationItem(n: NotificationItem, key: React.Key) {
    const icon = TYPE_ICONS[n.type] || "🔔";
    return (
      <div
        key={key}
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
  }

  // Render list for the active tab
  const activeTabDef = visibleTabs.find((t) => t.id === activeTab) ?? visibleTabs[0];
  const filtered = activeTabDef ? unifiedAll.filter(activeTabDef.filter) : [];
  const isActionsTab = activeTab === "actions" && actionsEnabled;
  const showSummaryChips = isActionsTab && summary;
  const ACTION_LIST_LIMIT = 4;
  const showExpandToggle = isActionsTab && actions.length > ACTION_LIST_LIMIT;
  const actionsToShow = isActionsTab && !actionsExpanded ? actions.slice(0, ACTION_LIST_LIMIT) : actions;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 hover:bg-accent transition-colors"
        aria-label="Notifications"
        title={totalBadge > 0 ? `${totalBadge} to look at` : "Notifications"}
      >
        <Bell className="h-5 w-5" />
        {totalBadge > 0 && (
          <span className={cn(
            "absolute top-0.5 right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white border-2 border-background",
            criticalCount > 0 ? "bg-red-600" : "bg-red-500"
          )}>
            {totalBadge > 99 ? "99+" : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-4 left-4 top-16 sm:absolute sm:top-auto sm:right-0 sm:left-auto sm:w-96 sm:mt-2 rounded-xl border bg-card shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Inbox
              <span className="text-[11px] text-muted-foreground font-normal">
                {totalBadge > 0 ? `${totalBadge} to look at` : "All caught up"}
              </span>
            </h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b overflow-x-auto">
            {visibleTabs.map((tab) => {
              const count = tabCounts(tab);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={cn(
                      "min-w-[14px] h-3.5 rounded-full px-1 flex items-center justify-center text-[8px]",
                      activeTab === tab.id ? "bg-primary-foreground/20" : "bg-accent"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="flex-1" />
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-[10px] text-primary hover:underline flex items-center gap-1 ml-1 whitespace-nowrap"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {/* Summary chips — Actions tab only */}
          {showSummaryChips && summary && (
            <div className="flex flex-wrap gap-1.5 text-[10px] font-medium px-4 py-2.5 border-b bg-muted/30">
              {criticalCount > 0 && (
                <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5", urgencyChip.critical.bg, urgencyChip.critical.color)}>
                  <AlertTriangle className="h-3 w-3" />{criticalCount} critical
                </span>
              )}
              {(summary.urgentCount ?? 0) > 0 && (
                <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5", urgencyChip.urgent.bg, urgencyChip.urgent.color)}>
                  <AlertTriangle className="h-3 w-3" />{summary.urgentCount} urgent
                </span>
              )}
              {(summary.pendingApprovals ?? 0) > 0 && (
                <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5", urgencyChip.urgent.bg, urgencyChip.urgent.color)}>
                  <Clock className="h-3 w-3" />{summary.pendingApprovals} pending
                </span>
              )}
              {(summary.upcomingTrainings ?? 0) > 0 && (
                <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5", urgencyChip.soon.bg, urgencyChip.soon.color)}>
                  <Calendar className="h-3 w-3" />{summary.upcomingTrainings} upcoming
                </span>
              )}
              {(summary.hrdfClaimsDue ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 px-2 py-0.5">
                  <Landmark className="h-3 w-3" />{summary.hrdfClaimsDue} claims
                </span>
              )}
              {(summary.pendingBookings ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5">
                  <ClipboardList className="h-3 w-3" />{summary.pendingBookings} bookings
                </span>
              )}
              {(summary.completedNoHrdf ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 px-2 py-0.5">
                  <Landmark className="h-3 w-3" />{summary.completedNoHrdf} HRDF
                </span>
              )}
              {(summary.unpublishedPrograms ?? 0) > 0 && (
                <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5", urgencyChip.soon.bg, urgencyChip.soon.color)}>
                  <Calendar className="h-3 w-3" />{summary.unpublishedPrograms} drafts
                </span>
              )}
              {(summary.pendingDocs ?? 0) > 0 && (
                <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5", urgencyChip.urgent.bg, urgencyChip.urgent.color)}>
                  <ClipboardList className="h-3 w-3" />{summary.pendingDocs} docs
                </span>
              )}
              {(summary.upcomingThisWeek ?? 0) > 0 && (
                <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5", urgencyChip.soon.bg, urgencyChip.soon.color)}>
                  <Calendar className="h-3 w-3" />{summary.upcomingThisWeek} this week
                </span>
              )}
              {(summary.zeroBookingPrograms ?? 0) > 0 && (
                <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5", urgencyChip.info.bg, urgencyChip.info.color)}>
                  <Sparkles className="h-3 w-3" />{summary.zeroBookingPrograms} empty
                </span>
              )}
            </div>
          )}

          {/* List */}
          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {activeTab === "all"
                    ? "All caught up — nothing to look at"
                    : activeTab === "actions"
                    ? "No actions right now"
                    : `No ${activeTab} notifications`}
                </p>
              </div>
            ) : isActionsTab ? (
              <div className="p-3 space-y-2">
                {actionsToShow.map((a, i) => renderActionItem(a, `act-${i}`))}
                {showExpandToggle && (
                  <button
                    onClick={() => setActionsExpanded(!actionsExpanded)}
                    className="w-full mt-1 flex items-center justify-center gap-1 text-[10px] text-primary hover:bg-primary/5 rounded-lg py-1 transition-colors font-medium"
                  >
                    {actionsExpanded ? (
                      <>Show less <ChevronUp className="h-3 w-3" /></>
                    ) : (
                      <>+{actions.length - ACTION_LIST_LIMIT} more <ChevronDown className="h-3 w-3" /></>
                    )}
                  </button>
                )}
              </div>
            ) : (
              filtered.map((item) => {
                if (item.kind === "notification") return renderNotificationItem(item.data, item.data.id);
                return null; // actions only render inside the Actions tab
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