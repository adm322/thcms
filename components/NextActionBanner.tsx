"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, ArrowRight, Loader2, Sparkles, ChevronDown, ChevronUp, X, Bell, Calendar, Landmark, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Badge } from "./ui/badge";

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

interface NextActionBannerProps {
  role: "HR" | "ADMIN" | "TRAINER";
}

const urgencyConfig = {
  critical: { bg: "border-red-300 bg-red-50", icon: AlertTriangle, iconColor: "text-red-500", badge: "destructive" as const },
  urgent: { bg: "border-amber-300 bg-amber-50", icon: AlertTriangle, iconColor: "text-amber-500", badge: "destructive" as const },
  soon: { bg: "border-blue-200 bg-blue-50", icon: Clock, iconColor: "text-blue-500", badge: "secondary" as const },
  info: { bg: "border-blue-200 bg-blue-50", icon: Clock, iconColor: "text-blue-400", badge: "secondary" as const },
};

export function NextActionBanner({ role }: NextActionBannerProps) {
  const [actions, setActions] = useState<Action[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [listExpanded, setListExpanded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  function fetchActions() {
    const apiPath = role === "HR" ? "/api/hr/actions" : role === "ADMIN" ? "/api/admin/actions" : "/api/trainer/actions";
    fetch(apiPath)
      .then(r => r.json())
      .then(d => {
        if (d.actions) {
          setActions(d.actions);
          setSummary(d.summary);
          // Auto-open if there are critical items
          if (d.actions.some((a: Action) => a.urgency === "critical")) {
            setPanelOpen(true);
          }
        }
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchActions();
    const interval = setInterval(fetchActions, 60000);
    return () => clearInterval(interval);
  }, [role]);

  async function handleRemind(bookingId: string) {
    await fetch("/api/admin/remind-hrdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
  }

  if (loading || error || actions.length === 0) return null;

  const urgentCount = actions.filter((a: Action) => a.urgency === "urgent" || a.urgency === "critical").length;
  const criticalCount = actions.filter((a: Action) => a.urgency === "critical").length;
  const firstUrgency = actions[0]?.urgency || "info";
  const config = urgencyConfig[firstUrgency];

  return (
    <>
      {/* Floating action widget — bottom-right */}
      <div className="fixed right-4 bottom-6 z-40 flex flex-col-reverse items-end gap-2">
        {/* Panel */}
        {panelOpen && (
          <div className={`rounded-xl border shadow-2xl w-80 max-h-[70vh] overflow-y-auto ${config.bg} transition-all duration-300 animate-in slide-in-from-right-4`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-inherit rounded-t-xl z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">
                  {criticalCount > 0
                    ? "Needs attention"
                    : urgentCount > 0
                    ? "Pending items"
                    : "What's next"}
                </span>
                {urgentCount > 0 && (
                  <Badge variant={config.badge} className="text-[10px]">{urgentCount}</Badge>
                )}
              </div>
              <button onClick={() => setPanelOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Summary stats */}
            {summary && (
              <div className="flex flex-wrap gap-1.5 text-[10px] font-medium px-4 py-2.5 border-b bg-muted/30">
                {summary.urgentCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-2 py-0.5">
                    <AlertTriangle className="h-3 w-3" />{summary.urgentCount}
                  </span>
                )}
                {summary.pendingApprovals > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-0.5">
                    <Clock className="h-3 w-3" />{summary.pendingApprovals} pending
                  </span>
                )}
                {summary.upcomingTrainings > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2 py-0.5">
                    <Calendar className="h-3 w-3" />{summary.upcomingTrainings}
                  </span>
                )}
                {summary.hrdfClaimsDue > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 px-2 py-0.5">
                    <Landmark className="h-3 w-3" />{summary.hrdfClaimsDue} claims
                  </span>
                )}
                {summary.pendingBookings > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5">
                    <ClipboardList className="h-3 w-3" />{summary.pendingBookings}
                  </span>
                )}
              </div>
            )}

            {/* Action list */}
            <div className="p-3 space-y-2">
              {(listExpanded ? actions : actions.slice(0, 4)).map((a: Action, i: number) => {
                const actConfig = urgencyConfig[a.urgency];
                const Icon = actConfig.icon;

                return (
                  <div key={i} className="flex gap-3 group">
                    {/* Color-coded icon separator */}
                    <div className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full ${{
                      critical: "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400",
                      urgent: "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
                      soon: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
                      info: "bg-muted text-muted-foreground",
                    }[a.urgency]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/80 leading-relaxed">{a.message}</p>
                      {a.type === "hrdf_claim" && a.deadlineDays !== undefined && (
                        <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${
                            a.deadlineDays <= 30 ? "bg-red-500" : a.deadlineDays <= 90 ? "bg-amber-500" : "bg-emerald-500"
                          }`} style={{ width: `${Math.max(3, Math.min(100, (a.deadlineDays / 180) * 100))}%` }} />
                        </div>
                      )}
                      {a.link && a.action && (
                        a.action === "Remind HR" && a.bookingId ? (
                          <button onClick={async () => { await handleRemind(a.bookingId!); }}
                            className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-primary hover:underline">
                            {a.action} <ArrowRight className="h-3 w-3" />
                          </button>
                        ) : (
                          <Link href={a.link} onClick={() => setPanelOpen(false)}
                            className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-primary hover:underline">
                            {a.action} <ArrowRight className="h-3 w-3" />
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                );
              })}

              {actions.length > 4 && (
                <button
                  onClick={() => setListExpanded(!listExpanded)}
                  className="w-full mt-1 flex items-center justify-center gap-1 text-[10px] text-primary hover:bg-primary/5 rounded-lg py-1 transition-colors font-medium"
                >
                  {listExpanded ? (
                    <>Show less <ChevronUp className="h-3 w-3" /></>
                  ) : (
                    <>+{actions.length - 4} more <ChevronDown className="h-3 w-3" /></>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Toggle pill button */}
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className={`flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg border transition-all hover:shadow-xl ${
            urgentCount > 0
              ? "bg-red-500 border-red-600 text-white hover:bg-red-600"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
          title={panelOpen ? "Close actions panel" : "Open actions panel"}
        >
          {panelOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Bell className={`h-4 w-4 ${urgentCount > 0 ? "bell-ring" : ""}`} />
          )}
          <span className="text-xs font-medium">
            {panelOpen ? "Close" : urgentCount > 0 ? `${urgentCount} action${urgentCount > 1 ? "s" : ""}` : "Actions"}
          </span>
          {urgentCount > 0 && !panelOpen && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold">{urgentCount}</span>
          )}
        </button>
      </div>
    </>
  );
}
