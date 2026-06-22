"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { useToast } from "@/components/Toast";
import {
  Building2, Users, Calendar, DollarSign, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, MessageSquare, TrendingUp, Target,
  Eye, EyeOff, ClipboardList, ArrowRight, ArrowLeft,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────

interface PlanItem {
  id: string;
  title: string;
  category: string;
  department: string | null;
  targetCount: number;
  targetMonth: number;
  targetYear: number;
  estimatedCost: number;
  priority: string;
  status: string;
  matchedProgramId: string | null;
  bookingId: string | null;
  notes: string | null;
  booking: {
    id: string;
    programDate: string;
    totalFee: number;
    status: string;
    programTitle: string;
    programCategory: string;
    trainerName: string;
  } | null;
}

interface CompanyPlan {
  companyId: string;
  companyName: string;
  employeeCount: number;
  planCount: number;
  totalSpent: number;
  plannedCost: number;
  completedPlans: number;
  scheduledPlans: number;
  draftPlans: number;
  matchedPlans: number;
  departments: { department: string; count: number; cost: number }[];
  items: PlanItem[];
}

interface AdminData {
  companies: CompanyPlan[];
  platformSummary: {
    totalCompanies: number;
    totalSpent: number;
    totalPlanned: number;
    totalPlanItems: number;
    year: number;
  };
}

// ─── Constants ─────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const STATUSES = ["DRAFT", "MATCHED", "SCHEDULED", "COMPLETED", "CANCELLED"];

const CATEGORY_COLORS: Record<string, string> = {
  Leadership: "bg-red-100 text-red-700",
  Technical: "bg-emerald-100 text-emerald-700",
  "Soft Skills": "bg-violet-100 text-violet-700",
  Compliance: "bg-amber-100 text-amber-700",
  "Team Building": "bg-rose-100 text-rose-700",
  "HR Operations": "bg-cyan-100 text-cyan-700",
};

const CATEGORY_DOT: Record<string, string> = {
  Leadership: "#ef4444",
  Technical: "#10b981",
  "Soft Skills": "#8b5cf6",
  Compliance: "#f59e0b",
  "Team Building": "#f43f5e",
  "HR Operations": "#06b6d4",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  MATCHED: "Matched",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const PIPELINE_TOOLTIPS: Record<string, string> = {
  DRAFT: "Need identified — no program chosen yet",
  MATCHED: "Course found — ready to book a date",
  SCHEDULED: "Booked & confirmed — training is happening",
  COMPLETED: "Done — evaluations & HRDF submitted",
  CANCELLED: "No longer needed",
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-blue-100 text-blue-700",
};

// ─── Main Component ────────────────────────────────────────

export default function AdminTrainingPlansPage() {
  const { toast } = useToast();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [noteItemId, setNoteItemId] = useState<string | null>(null);
  const [rejectItemId, setRejectItemId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [showBulkReject, setShowBulkReject] = useState(false);
  const [bulkInProgress, setBulkInProgress] = useState(false);

  const fetchData = useCallback(async (showFullLoader = false) => {
    if (showFullLoader) setLoading(true);
    try {
      const res = await fetch(`/api/admin/training-plans?year=${viewYear}`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [viewYear]);

  useEffect(() => { fetchData(true); }, [fetchData]);

  function changeYear(delta: number) {
    setViewYear(viewYear + delta);
    // fetchData will fire via useEffect dependency on viewYear
  }

  async function adminAction(id: string, action: string, extra?: any) {
    const body: any = { action };
    if (action === "REJECT" && extra?.reason) body.adminNotes = extra.reason;
    const res = await fetch(`/api/admin/training-plans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast(`Item ${action.toLowerCase()}${action === "REJECT" ? "ed" : "d"}`, "success");
      setRejectItemId(null);
      setRejectReason("");
      fetchData();
    } else {
      toast("Action failed", "error");
    }
  }

  async function addAdminNote(id: string) {
    if (!adminNote.trim()) return;
    const res = await fetch(`/api/admin/training-plans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "NOTE", adminNotes: adminNote }),
    });
    if (res.ok) {
      toast("Note added", "success");
      setAdminNote("");
      setNoteItemId(null);
      fetchData();
    } else {
      toast("Failed to add note", "error");
    }
  }

  async function bulkAction(action: "APPROVE" | "REJECT") {
    setBulkInProgress(true);
    let success = 0;
    for (const id of selectedItems) {
      const body: any = { action };
      if (action === "REJECT" && bulkRejectReason) body.adminNotes = bulkRejectReason;
      const res = await fetch(`/api/admin/training-plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) success++;
    }
    toast(`${success}/${selectedItems.size} items ${action.toLowerCase()}ed`, "success");
    setSelectedItems(new Set());
    setShowBulkReject(false);
    setBulkRejectReason("");
    setBulkInProgress(false);
    fetchData();
  }

  function toggleSelectAll(company: CompanyPlan) {
    const newSet = new Set(selectedItems);
    const companyIds = company.items.map(i => i.id);
    const allSelected = companyIds.every(id => newSet.has(id));
    if (allSelected) companyIds.forEach(id => newSet.delete(id));
    else companyIds.forEach(id => newSet.add(id));
    setSelectedItems(newSet);
  }

  function toggleItem(id: string) {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedItems(newSet);
  }

  function getCompanyMonthItems(company: CompanyPlan, month: number): PlanItem[] {
    return company.items.filter((p) => p.targetMonth === month);
  }

  if (initialLoad && loading) return <PlansSkeleton />;

  const summary = data?.platformSummary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Training Plans</h1>
        <p className="text-muted-foreground">All-company training plan oversight & approval</p>
      </div>

      {/* ─── Platform Summary Bar ─────────────────────────── */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Companies</p>
                <p className="text-lg font-bold">{summary.totalCompanies}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Plan Items</p>
                <p className="text-lg font-bold">{summary.totalPlanItems}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-lg font-bold">RM {summary.totalSpent.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <Target className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Planned</p>
                <p className="text-lg font-bold">RM {summary.totalPlanned.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Year</p>
                <p className="text-lg font-bold">{summary.year}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Company Cards ────────────────────────────────── */}
      <div className="space-y-4">
        {data?.companies.map((company) => {
          const isExpanded = expandedCompany === company.companyId;
          return (
            <Card key={company.companyId} className={isExpanded ? "ring-2 ring-primary/30" : ""}>
              {/* Company header */}
              <button
                onClick={() => setExpandedCompany(isExpanded ? null : company.companyId)}
                className="w-full flex items-center justify-between p-5 hover:bg-accent/30 transition-colors rounded-t-xl"
              >
                <div className="flex items-center gap-4">
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <p className="text-base font-bold">{company.companyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {company.employeeCount} employees · {company.planCount} plan items
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    <Badge variant="secondary" className="mr-1">{company.draftPlans}</Badge> draft
                  </span>
                  <span className="text-muted-foreground">
                    <Badge variant="secondary" className="mr-1">{company.matchedPlans}</Badge> matched
                  </span>
                  <span className="text-muted-foreground">
                    <Badge variant="default" className="mr-1">{company.scheduledPlans}</Badge> scheduled
                  </span>
                  <span className="font-semibold">RM {company.plannedCost.toLocaleString()}</span>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t pt-4">
                  {/* Company stats */}
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border px-3 py-2">
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                      <p className="text-sm font-bold">RM {company.totalSpent.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border px-3 py-2">
                      <p className="text-xs text-muted-foreground">Planned Cost</p>
                      <p className="text-sm font-bold">RM {company.plannedCost.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border px-3 py-2">
                      <p className="text-xs text-muted-foreground">Departments</p>
                      <p className="text-sm font-bold">{company.departments.length}</p>
                    </div>
                    <div className="rounded-lg border px-3 py-2">
                      <p className="text-xs text-muted-foreground">Budget Utilization</p>
                      <p className="text-sm font-bold">
                        {company.totalSpent + company.plannedCost > 0
                          ? `${Math.round((company.totalSpent / (company.totalSpent + company.plannedCost + 1)) * 100)}%`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Department breakdown */}
                  {company.departments.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Departments</p>
                      <div className="flex flex-wrap gap-2">
                        {company.departments.map((d) => (
                          <Badge key={d.department} variant="outline" className="text-[10px]">
                            {d.department} · {d.count} items · RM {d.cost.toLocaleString()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Year selector for this company */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Year:</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => changeYear(-1)}>←</Button>
                    <span className="text-sm font-bold">{viewYear}</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => changeYear(1)}>→</Button>
                  </div>

                  {/* 12-month plan grid */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Annual Plan — {viewYear}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {MONTHS.map((m, i) => {
                        const items = getCompanyMonthItems(company, i);
                        return (
                          <div key={i} className="rounded-lg border p-2 text-center">
                            <p className="text-[10px] font-semibold text-muted-foreground">{m}</p>
                            <p className="text-sm font-bold">{items.length > 0 ? items.length : "—"}</p>
                            <div className="flex justify-center gap-0.5 mt-1">
                              {items.slice(0, 4).map((item) => (
                                <span
                                  key={item.id}
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: CATEGORY_DOT[item.category] || "#6b7280" }}
                                  title={item.title}
                                />
                              ))}
                              {items.length > 4 && <span className="text-[8px] text-muted-foreground">+</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Plan items list with admin actions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                          All Plan Items ({company.items.length})
                        </p>
                        <button
                          onClick={() => toggleSelectAll(company)}
                          className="text-[10px] text-primary hover:underline"
                        >
                          {company.items.length > 0 && company.items.every(i => selectedItems.has(i.id)) ? "Deselect All" : "Select All"}
                        </button>
                      </div>
                      {/* Bulk action bar */}
                      {selectedItems.size > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{selectedItems.size} selected</Badge>
                          {!showBulkReject ? (
                            <>
                              <Button
                                size="sm" className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => bulkAction("APPROVE")}
                                disabled={bulkInProgress}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-0.5" /> Approve All
                              </Button>
                              <Button
                                size="sm" variant="outline"
                                className="h-7 text-[10px] text-red-500 border-red-300"
                                onClick={() => setShowBulkReject(true)}
                              >
                                <XCircle className="h-3 w-3 mr-0.5" /> Reject All
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input
                                value={bulkRejectReason}
                                onChange={(e) => setBulkRejectReason(e.target.value)}
                                placeholder="Reason for rejection..."
                                className="h-7 text-[10px] w-48"
                              />
                              <Button
                                size="sm" className="h-7 text-[10px] bg-red-600 hover:bg-red-700"
                                onClick={() => bulkAction("REJECT")}
                                disabled={bulkInProgress}
                              >
                                Confirm
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => { setShowBulkReject(false); setBulkRejectReason(""); }}>
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {company.items.length === 0 && (
                        <p className="text-sm text-muted-foreground">No plan items for this year.</p>
                      )}
                      {company.items.map((item) => (
                        <div key={item.id} className="flex items-start rounded-lg border px-4 py-3 gap-2">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleItem(item.id)}
                            className="mt-1.5 h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-[10px] ${CATEGORY_COLORS[item.category] || ""}`}>
                                {item.category}
                              </Badge>
                              <Badge className={`text-[10px] ${PRIORITY_COLORS[item.priority]}`}>
                                {item.priority}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]" title={PIPELINE_TOOLTIPS[item.status] || ""}>{STATUS_LABELS[item.status]}</Badge>
                              {item.booking && (
                                <Badge variant="default" className="text-[10px] bg-emerald-100 text-emerald-700">
                                  Booked
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium mt-1">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.department && <>{item.department} · </>}
                              {item.targetCount} pax · {MONTHS[item.targetMonth]} · RM {item.estimatedCost.toLocaleString()}
                              {item.booking && <> · ✅ {item.booking.programTitle}</>}
                            </p>
                            {item.notes && (
                              <p className="text-[10px] text-muted-foreground mt-1 italic line-clamp-2">
                                📝 {item.notes}
                              </p>
                            )}
                          </div>
                          {/* Admin actions */}
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            {(() => {
                              const isApproved = item.notes?.includes("[Admin Approved");
                              const isRejected = item.notes?.includes("[Admin Rejected");
                              const latestRejection = isRejected && (!isApproved || (item.notes?.lastIndexOf("[Admin Rejected") ?? 0) > (item.notes?.lastIndexOf("[Admin Approved") ?? 0));
                              const isTerminal = item.status === "COMPLETED" || item.status === "CANCELLED";

                              if (isTerminal) {
                                return <Badge variant="outline" className="text-[10px]">{item.status}</Badge>;
                              }

                              if (latestRejection || (!isApproved && !isRejected)) {
                                return (
                                  <>
                                    <Button
                                      size="sm" variant="outline"
                                      className="h-7 text-[10px] text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:bg-emerald-950/30"
                                      onClick={() => adminAction(item.id, "APPROVE")}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-0.5" /> Approve
                                    </Button>
                                    <Button
                                      size="sm" variant="outline"
                                      className="h-7 text-[10px] text-red-500 border-red-300 hover:bg-red-50 dark:bg-red-950/30"
                                      onClick={() => { setRejectItemId(item.id); setRejectReason(""); }}
                                    >
                                      <XCircle className="h-3 w-3 mr-0.5" /> Reject
                                    </Button>
                                  </>
                                );
                              }
                              if (isApproved) {
                                return <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">✅ Approved</Badge>;
                              }
                              return null;
                            })()}
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 text-[10px]"
                              onClick={() => {
                                const newId = noteItemId === item.id ? null : item.id;
                                setNoteItemId(newId);
                                setAdminNote("");
                              }}
                            >
                              <MessageSquare className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Rejection reason prompt */}
                          {rejectItemId === item.id && (
                            <div className="col-span-full mt-2 space-y-2">
                              <p className="text-[10px] font-medium text-red-600">Reject this plan item? HR will need to revise it.</p>
                              <div className="flex gap-2">
                                <Input
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="Reason for rejection..."
                                  className="h-8 text-xs"
                                />
                                <Button size="sm" className="h-8 text-xs bg-red-600 hover:bg-red-700" onClick={() => adminAction(item.id, "REJECT", { reason: rejectReason })}>
                                  Confirm Reject
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setRejectItemId(null)}>Cancel</Button>
                              </div>
                            </div>
                          )}

                          {/* Admin note input */}
                          {noteItemId === item.id && (
                            <div className="col-span-full mt-2 flex gap-2">
                              <Input
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Add note for HR..."
                                className="h-8 text-xs"
                              />
                              <Button size="sm" className="h-8 text-xs" onClick={() => addAdminNote(item.id)}>
                                Add Note
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {(!data || data.companies.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No companies have training plans yet.</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(CATEGORY_DOT).map(([cat, color]) => (
          <span key={cat} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────

function PlansSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}
