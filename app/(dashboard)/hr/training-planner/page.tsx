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
import Link from "next/link";
import {
  Plus, Calendar, KanbanSquare, TrendingUp, DollarSign,
  Users, Target, AlertTriangle, CheckCircle2, Clock, X,
  ChevronRight, ChevronLeft, ChevronDown, Search, ArrowRight, ArrowLeft,
  Flag, Building2, ClipboardList, Ban, Pin, MessageSquare, Download,
} from "lucide-react";
import { CalendarView, type CalendarEvent } from "@/components/CalendarView";
import {
  getHolidaysForMonth,
  getActivePeriods,
  isFavorableMonth,
  isBlackoutPeriod,
  isPublicHoliday,
} from "@/lib/malaysia-holidays";

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
  createdAt: string;
}

interface PlanSummary {
  annualBudget: number;
  totalSpent: number;
  plannedCost: number;
  remainingBudget: number;
  utilizationPercent: number;
  hrdfLevyEstimate: number;
  employeeCount: number;
  planItemCount: number;
  completedPlans: number;
  scheduledPlans: number;
  draftPlans: number;
  matchedPlans: number;
  cancelledPlans: number;
  byDepartment: { department: string; planned: number; spent: number; count: number }[];
  byMonth: Record<number, { planned: number; spent: number; plannedCount: number; bookedCount: number }>;
  statusCounts: Record<string, number>;
}

interface BookingItem {
  id: string;
  programTitle: string;
  category: string;
  trainerName: string;
  programDate: string;
  totalFee: number;
  status: string;
}

// ─── Constants ─────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CATEGORIES = ["Leadership", "Technical", "Soft Skills", "Compliance", "Team Building", "HR Operations"];
const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];
const STATUSES = ["DRAFT", "MATCHED", "SCHEDULED", "COMPLETED", "CANCELLED"];

const CATEGORY_COLORS: Record<string, string> = {
  Leadership: "bg-red-100 text-red-700 border-red-300",
  Technical: "bg-emerald-100 text-emerald-700 border-emerald-300",
  "Soft Skills": "bg-violet-100 text-violet-700 border-violet-300",
  Compliance: "bg-amber-100 text-amber-700 border-amber-300",
  "Team Building": "bg-rose-100 text-rose-700 border-rose-300",
  "HR Operations": "bg-cyan-100 text-cyan-700 border-cyan-300",
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
  MATCHED: "Program Matched",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const PIPELINE_TOOLTIPS: Record<string, string> = {
  DRAFT: "Training need identified — no program chosen yet",
  MATCHED: "Right course found — ready to pick a date & book",
  SCHEDULED: "Booked & confirmed — training is happening",
  COMPLETED: "Training done — evaluations & HRDF submitted",
  CANCELLED: "No longer needed",
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-blue-100 text-blue-700",
};

// ─── Main Component ────────────────────────────────────────

export default function TrainingPlannerPage() {
  const { toast } = useToast();
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [summary, setSummary] = useState<PlanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState<PlanItem | null>(null);
  const [bookDate, setBookDate] = useState("");
  const [bookPax, setBookPax] = useState(0);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState<PlanItem | null>(null);
  const [marketPrograms, setMarketPrograms] = useState<any[]>([]);
  const [matchSearch, setMatchSearch] = useState("");
  const [matchCategory, setMatchCategory] = useState("All");
  const [matchLoading, setMatchLoading] = useState(false);
  const [expandedStatuses, setExpandedStatuses] = useState<Set<string>>(new Set(STATUSES));
  const [budget, setBudget] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("trainhub_budget") || "85000");
    }
    return 85000;
  });
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  // New item form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Technical");
  const [newDept, setNewDept] = useState("");
  const [newCount, setNewCount] = useState(10);
  const [newMonth, setNewMonth] = useState(new Date().getMonth());
  const [newCost, setNewCost] = useState(0);
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newNotes, setNewNotes] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [planRes, bookingRes, summaryRes] = await Promise.all([
        fetch(`/api/hr/training-plan?year=${viewYear}`),
        fetch("/api/hr/bookings"),
        fetch(`/api/hr/training-plan/summary?year=${viewYear}`),
      ]);
      if (planRes.ok) {
        const planData = await planRes.json();
        setPlanItems(Array.isArray(planData) ? planData : planData.data || []);
      }
      if (bookingRes.ok) setBookings(await bookingRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } catch (e) {
      console.error("Failed to load planner data", e);
    } finally {
      setLoading(false);
    }
  }, [viewYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Actions ───────────────────────────────────────────────

  async function addPlanItem() {
    if (!newTitle.trim()) return;
    const res = await fetch("/api/hr/training-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        category: newCategory,
        department: newDept || null,
        targetCount: newCount,
        targetMonth: newMonth,
        targetYear: viewYear,
        estimatedCost: newCost,
        priority: newPriority,
        notes: newNotes || null,
      }),
    });
    if (res.ok) {
      toast("Plan item added", "success");
      setShowAddModal(false);
      resetForm();
      fetchData();
    } else {
      toast("Failed to add item", "error");
    }
  }

  function resetForm() {
    setNewTitle("");
    setNewCategory("Technical");
    setNewDept("");
    setNewCount(10);
    setNewMonth(new Date().getMonth());
    setNewCost(0);
    setNewPriority("MEDIUM");
    setNewNotes("");
  }

  async function updateStatus(id: string, newStatus: string, bookingId?: string) {
    const body: any = { status: newStatus };
    if (bookingId) body.bookingId = bookingId;
    const res = await fetch(`/api/hr/training-plan/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast(`Status updated to ${STATUS_LABELS[newStatus] || newStatus}`, "success");
      fetchData();
    } else {
      toast("Failed to update", "error");
    }
  }

  async function deleteItem(id: string) {
    const res = await fetch(`/api/hr/training-plan/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Plan item removed", "success");
      fetchData();
    } else {
      toast("Failed to delete", "error");
    }
  }

  async function oneClickBook(item: PlanItem) {
    setBookingInProgress(true);
    const res = await fetch("/api/hr/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programId: item.matchedProgramId,
        participantCount: bookPax || item.targetCount,
        programDate: bookDate || `${viewYear}-${String(item.targetMonth + 1).padStart(2, "0")}-15`,
      }),
    });
    if (res.ok) {
      const booking = await res.json();
      await updateStatus(item.id, "SCHEDULED", booking.id);
      setShowBookModal(null);
      toast("Booking created and linked to plan!", "success");
    } else {
      toast("Booking failed — program may not be available", "error");
    }
    setBookingInProgress(false);
  }

  async function openMatchModal(item: PlanItem) {
    setShowMatchModal(item);
    setMatchSearch("");
    setMatchCategory(item.category || "All");
    setMatchLoading(true);
    const params = new URLSearchParams();
    if (item.category) params.set("category", item.category);
    try {
      const res = await fetch(`/api/hr/programs?${params.toString()}`);
      if (res.ok) setMarketPrograms(await res.json());
    } catch (e) { console.error(e); }
    setMatchLoading(false);
  }

  async function matchProgramToItem(planItemId: string, programId: string, programTitle: string, estimatedCost: number) {
    const res = await fetch(`/api/hr/training-plan/${planItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchedProgramId: programId, status: "MATCHED", estimatedCost }),
    });
    if (res.ok) {
      toast(`Matched to "${programTitle}" — ready to book!`, "success");
      setShowMatchModal(null);
      fetchData();
    } else {
      toast("Failed to match program", "error");
    }
  }

  async function searchMarketPrograms() {
    setMatchLoading(true);
    const params = new URLSearchParams();
    if (matchSearch) params.set("search", matchSearch);
    if (matchCategory !== "All") params.set("category", matchCategory);
    try {
      const res = await fetch(`/api/hr/programs?${params.toString()}`);
      if (res.ok) setMarketPrograms(await res.json());
    } catch (e) { console.error(e); }
    setMatchLoading(false);
  }

  function saveBudget() {
    const val = parseInt(budgetInput) || budget;
    setBudget(val);
    localStorage.setItem("trainhub_budget", String(val));
    setEditingBudget(false);
    toast(`Budget set to RM ${val.toLocaleString()}`, "success");
  }

  function startEditBudget() {
    setBudgetInput(String(budget));
    setEditingBudget(true);
  }

  function exportCSV() {
    const headers = ["Title","Category","Department","Target Count","Target Month","Estimated Cost","Priority","Status"];
    const rows = planItems.map(item => [
      item.title, item.category, item.department || "", String(item.targetCount),
      MONTHS[item.targetMonth], String(item.estimatedCost), item.priority, item.status
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `training-plan-${viewYear}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast("CSV downloaded", "success");
  }

  const effectiveBudget = budget;
  const effectiveUtilization = Math.round((summary?.totalSpent || 0) / effectiveBudget * 100);
  const effectiveRemaining = Math.max(0, effectiveBudget - (summary?.totalSpent || 0) - (summary?.plannedCost || 0));

  function toggleStatusExpanded(status: string) {
    const next = new Set(expandedStatuses);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    setExpandedStatuses(next);
  }

  // ─── Calendar helpers ──────────────────────────────────────

  function getMonthItems(month: number): PlanItem[] {
    return planItems.filter((p) => p.targetMonth === month && p.targetYear === viewYear);
  }

  function getMonthBookings(month: number): BookingItem[] {
    return bookings.filter((b) => {
      const d = new Date(b.programDate);
      return d.getMonth() === month && d.getFullYear() === viewYear;
    });
  }

  // ─── Rendering ─────────────────────────────────────────────

  if (loading) return <PlannerSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Planner</h1>
          <p className="text-muted-foreground">Annual training plan, budget tracking & pipeline management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" />Export CSV
          </Button>
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Plan Item
          </Button>
        </div>
      </div>

      {/* ─── Budget Bar ─────────────────────────────────────── */}
      {summary && (
        <CollapsibleSection title={<span><DollarSign className="h-4 w-4 inline mr-1" />Training Budget 2026</span>} subtitle={`RM ${summary.totalSpent.toLocaleString()} spent of RM ${effectiveBudget.toLocaleString()}`} badge={`${effectiveUtilization}% utilized`}>
          <div className="space-y-4">
            {/* Budget editor */}
            <div className="flex items-center gap-2">
              {editingBudget ? (
                <>
                  <span className="text-xs text-muted-foreground">RM</span>
                  <Input
                    type="number"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="h-8 w-32 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                  />
                  <Button size="sm" className="h-8 text-xs" onClick={saveBudget}>Save</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingBudget(false)}>Cancel</Button>
                </>
              ) : (
                <button onClick={startEditBudget} className="text-sm font-bold text-primary hover:underline">
                  Annual Budget: RM {effectiveBudget.toLocaleString()} ✎
                </button>
              )}
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Spent: RM {summary.totalSpent.toLocaleString()}</span>
                <span className="text-muted-foreground">Planned: RM {summary.plannedCost.toLocaleString()}</span>
                <span className="font-medium">Remaining: RM {effectiveRemaining.toLocaleString()}</span>
              </div>
              <div className="h-4 w-full rounded-full bg-muted overflow-hidden flex">
                <div className="h-full bg-emerald-50 dark:bg-emerald-950/300 transition-all" style={{ width: `${Math.min(effectiveUtilization, 100)}%` }} />
                <div className="h-full bg-amber-400/60 transition-all" style={{ width: `${Math.min(Math.round(((summary?.plannedCost || 0) / effectiveBudget) * 100), 100 - effectiveUtilization)}%` }} />
                <div className="h-full bg-muted-foreground/15 flex-1" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg border px-3 py-2">
                <p className="text-xs text-muted-foreground">HRDF Levy Estimate</p>
                <p className="text-sm font-bold">RM {summary.hrdfLevyEstimate.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border px-3 py-2">
                <p className="text-xs text-muted-foreground">Active Employees</p>
                <p className="text-sm font-bold">{summary.employeeCount}</p>
              </div>
              <div className="rounded-lg border px-3 py-2">
                <p className="text-xs text-muted-foreground">Plan Items</p>
                <p className="text-sm font-bold">{summary.planItemCount} ({summary.draftPlans} draft, {summary.matchedPlans} matched, {summary.scheduledPlans} scheduled)</p>
              </div>
              <div className="rounded-lg border px-3 py-2">
                <p className="text-xs text-muted-foreground">Budget per Employee</p>
                <p className="text-sm font-bold">RM {summary.employeeCount > 0 ? Math.round(effectiveBudget / summary.employeeCount).toLocaleString() : "—"}</p>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ─── Main Tabs ──────────────────────────────────────── */}
      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar"><Calendar className="h-4 w-4 mr-1" /> Smart Calendar</TabsTrigger>
          <TabsTrigger value="pipeline"><KanbanSquare className="h-4 w-4 mr-1" /> Pipeline ({planItems.length})</TabsTrigger>
        </TabsList>

        {/* ═══════════ CALENDAR TAB ═══════════ */}
        <TabsContent value="calendar" className="space-y-4 mt-4">
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setViewYear(viewYear - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-bold w-20 text-center">{viewYear}</h3>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setViewYear(viewYear + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="ml-2" onClick={() => { setViewYear(new Date().getFullYear()); }}>
              Today
            </Button>
            {selectedMonth !== null && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedMonth(null)}>
                <X className="h-3 w-3 mr-1" /> Clear Month Detail
              </Button>
            )}
          </div>

          {/* Month info bar — shows plan summary for visible month */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {MONTHS.map((m, i) => {
              const monthBudget = summary?.byMonth?.[i];
              const plannedCount = monthBudget?.plannedCount || 0;
              const bookedCount = monthBudget?.bookedCount || 0;
              const plannedCost = monthBudget?.planned || 0;
              const isSelected = selectedMonth === i;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedMonth(isSelected ? null : i)}
                  className={`rounded-lg border p-2 text-center transition-colors ${
                    isSelected ? "border-primary bg-primary/10" : "hover:border-primary/30"
                  }`}
                >
                  <p className="text-[10px] font-semibold">{m}</p>
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {plannedCount > 0 && <span className="text-[9px] text-amber-600 font-medium">{plannedCount}<ClipboardList className="h-3 w-3 inline ml-0.5" /></span>}
                    {bookedCount > 0 && <span className="text-[9px] text-emerald-600 font-medium">{bookedCount}<CheckCircle2 className="h-3 w-3 inline ml-0.5" /></span>}
                    {plannedCount === 0 && bookedCount === 0 && <span className="text-[9px] text-muted-foreground">—</span>}
                  </div>
                  {plannedCost > 0 && (
                    <div className="h-1 w-full rounded-full bg-muted mt-1 overflow-hidden">
                      <div className="h-full bg-amber-400/60" style={{ width: `${Math.min(100, Math.round((plannedCost / effectiveBudget) * 100 * 8))}%` }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Google-style calendar using CalendarView component */}
          <Card>
            <CardContent className="pt-4">
              <CalendarView
                events={[
                  // Actual bookings on their real dates
                  ...bookings.map((b) => ({
                    id: b.id,
                    title: b.programTitle,
                    category: b.category,
                    date: b.programDate,
                    status: b.status,
                    companyName: "",
                    trainerName: b.trainerName,
                    locationType: "",
                    totalFee: b.totalFee,
                  })),
                  // Plan items spread across their target month as "planned" markers
                  ...planItems.flatMap((item) => {
                    const year = item.targetYear;
                    const month = item.targetMonth;
                    // Spread 2-3 markers across the month so the plan is visible
                    const days = [1, 10, 20];
                    return days.map((day) => ({
                      id: `${item.id}_plan_${day}`,
                      title: `📋 ${item.title}`,
                      category: item.category,
                      date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
                      status: `PLANNED_${item.status}`,
                      companyName: item.department || "",
                      trainerName: `${item.targetCount} pax · RM ${item.estimatedCost.toLocaleString()}`,
                      locationType: item.status === "SCHEDULED" ? "scheduled" : "planned",
                      totalFee: item.estimatedCost,
                    }));
                  }),
                ]}
                onEventClick={(event) => {
                  const month = new Date(event.date).getMonth();
                  setSelectedMonth(month);
                  setViewYear(new Date(event.date).getFullYear());
                }}
              />
            </CardContent>
          </Card>

          {/* Month Detail Panel */}
          {selectedMonth !== null && (
            <Card className="border-primary/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span><Calendar className="h-4 w-4 inline mr-1" />{MONTHS_FULL[selectedMonth]} {viewYear} — Detail</span>
                  <Button variant="outline" size="sm" onClick={() => { setNewMonth(selectedMonth); setShowAddModal(true); }}>
                    <Plus className="h-3 w-3 mr-1" /> Add to {MONTHS[selectedMonth]}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Planned items */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    <ClipboardList className="h-3.5 w-3.5 inline mr-1" />Planned ({getMonthItems(selectedMonth).length})
                  </p>
                  {getMonthItems(selectedMonth).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No planned items for this month.</p>
                  ) : (
                    <div className="space-y-2">
                      {getMonthItems(selectedMonth).map((item) => (
                        <div key={item.id} className="flex items-start justify-between rounded-lg border px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-[10px] ${CATEGORY_COLORS[item.category]?.split(" ")[0] || ""} ${CATEGORY_COLORS[item.category]?.split(" ")[1] || ""}`}>
                                {item.category}
                              </Badge>
                              <Badge className={`text-[10px] ${PRIORITY_COLORS[item.priority]}`}>
                                {item.priority}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]" title={PIPELINE_TOOLTIPS[item.status] || ""}>{STATUS_LABELS[item.status]}</Badge>
                            </div>
                            <p className="text-sm font-medium mt-1">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.department && <><Building2 className="h-3 w-3 inline mr-0.5" />{item.department} · </>}
                              <Users className="h-3 w-3 inline mr-0.5" />{item.targetCount} pax
                              {item.estimatedCost > 0 && <> · <DollarSign className="h-3 w-3 inline mr-0.5" />RM {item.estimatedCost.toLocaleString()}</>}
                            </p>
                            {item.booking && (
                              <p className="text-xs text-emerald-600 mt-0.5">
                                <CheckCircle2 className="h-3.5 w-3.5 inline mr-1 text-emerald-500" />Booked: {item.booking.programTitle} · {new Date(item.booking.programDate).toLocaleDateString("en-MY")}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            {item.status === "DRAFT" && (
                              <Button size="sm" className="h-7 text-[10px]" onClick={() => openMatchModal(item)}>
                                <Search className="h-3.5 w-3.5 inline mr-1" />Find Program
                              </Button>
                            )}
                            {item.status === "MATCHED" && !item.matchedProgramId && (
                              <Button size="sm" className="h-7 text-[10px]" onClick={() => openMatchModal(item)}>
                                <Search className="h-3.5 w-3.5 inline mr-1" />Find Program
                              </Button>
                            )}
                            {item.status === "MATCHED" && item.matchedProgramId && (
                              <Button size="sm" className="h-7 text-[10px] bg-primary" onClick={() => { setShowBookModal(item); setBookPax(item.targetCount); setBookDate(`${viewYear}-${String(selectedMonth! + 1).padStart(2, "0")}-15`); }}>
                                <Calendar className="h-2.5 w-2.5 mr-0.5" />Book Now
                              </Button>
                            )}
                            {item.status === "SCHEDULED" && (
                              <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => updateStatus(item.id, "COMPLETED")}>
                                <CheckCircle2 className="h-3 w-3 mr-0.5" /> Complete
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 text-[10px] text-muted-foreground" onClick={() => deleteItem(item.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actual bookings */}
                <div className="pt-3 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />Actual Bookings ({getMonthBookings(selectedMonth).length})
                  </p>
                  {getMonthBookings(selectedMonth).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No bookings for this month.</p>
                  ) : (
                    <div className="space-y-2">
                      {getMonthBookings(selectedMonth).map((b) => (
                        <div key={b.id} className="flex items-center justify-between rounded-lg border px-4 py-3 bg-accent/30">
                          <div>
                            <p className="text-sm font-medium">{b.programTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              {b.trainerName} · {new Date(b.programDate).toLocaleDateString("en-MY")} · RM {b.totalFee.toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={b.status === "COMPLETED" ? "default" : "outline"}>{b.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Conflict warnings */}
                {(() => {
                  const holidays = getHolidaysForMonth(viewYear, selectedMonth).filter(h => h.isPublicHoliday);
                  const blackout = isBlackoutPeriod(`${viewYear}-${String(selectedMonth + 1).padStart(2, "0")}-15`);
                  const periods = getActivePeriods(`${viewYear}-${String(selectedMonth + 1).padStart(2, "0")}-15`);
                  if (holidays.length > 0 || blackout || periods.length > 0) {
                    return (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 mt-2">
                        <p className="text-xs font-semibold text-amber-700 mb-1"><AlertTriangle className="h-3.5 w-3.5 inline mr-1" />Scheduling Alerts</p>
                        {blackout && <p className="text-xs text-amber-600"><Ban className="h-3 w-3 inline mr-1" />Blackout period: {blackout} — avoid scheduling training.</p>}
                        {periods.filter(p => p.affectsWork).map(p => (
                          <p key={p.name} className="text-xs text-amber-600"><Pin className="h-3 w-3 inline mr-1" />{p.name}: {p.description}</p>
                        ))}
                        {holidays.map(h => (
                          <p key={h.date} className="text-xs text-amber-600"><Flag className="h-3 w-3 inline mr-1" />{h.name} — {new Date(h.date).toLocaleDateString("en-MY")}</p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(CATEGORY_DOT).map(([cat, color]) => (
              <span key={cat} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                {cat}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 bg-amber-400" /> Planned
            </span>
          </div>
        </TabsContent>

        {/* ═══════════ PIPELINE TAB ═══════════ */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="space-y-2">
            {STATUSES.map((status) => {
              const items = planItems.filter((p) => p.status === status);
              const nextStatus = STATUSES[STATUSES.indexOf(status) + 1];
              const prevStatus = STATUSES[STATUSES.indexOf(status) - 1];
              const isExpanded = expandedStatuses.has(status);

              return (
                <div key={status} className="rounded-xl border bg-card overflow-hidden">
                  {/* Group header — clickable */}
                  <button
                    onClick={() => toggleStatusExpanded(status)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-sm font-semibold">{STATUS_LABELS[status]}</span>
                    <Badge variant={items.length > 0 ? "default" : "secondary"} className="text-[10px] h-5">
                      {items.length}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground flex-1 text-left hidden sm:inline">
                      {PIPELINE_TOOLTIPS[status]}
                    </span>
                  </button>

                  {/* Items list */}
                  {isExpanded && (
                    <div className="border-t">
                      {items.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No items in this stage</p>
                      ) : (
                        <div className="divide-y">
                          {items.map((item) => (
                            <div key={item.id} className="px-4 py-3 hover:bg-accent/20 transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <Badge className={`text-[10px] ${CATEGORY_COLORS[item.category]?.split(" ")[0] || ""} ${CATEGORY_COLORS[item.category]?.split(" ")[1] || ""}`}>
                                      {item.category}
                                    </Badge>
                                    <Badge className={`text-[10px] ${PRIORITY_COLORS[item.priority]}`}>{item.priority}</Badge>
                                    {item.matchedProgramId && (
                                      <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-300">Linked</Badge>
                                    )}
                                    {item.booking && (
                                      <Badge variant="outline" className="text-[9px] text-blue-600 border-blue-300">Booked</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm font-medium">{item.title}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {item.department && <><Building2 className="h-3 w-3 inline mr-0.5" />{item.department} · </>}
                                    <Users className="h-3 w-3 inline mr-0.5" />{item.targetCount} pax
                                    {item.estimatedCost > 0 && <> · <DollarSign className="h-3 w-3 inline mr-0.5" />RM {item.estimatedCost.toLocaleString()}</>}
                                    <span className="ml-3"><Calendar className="h-3 w-3 inline mr-0.5" />{MONTHS[item.targetMonth]} {item.targetYear}</span>
                                  </p>
                                  {item.notes && (
                                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1 italic">
                                      <MessageSquare className="h-3 w-3 inline mr-0.5" />{item.notes}
                                    </p>
                                  )}
                                </div>
                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {prevStatus && (
                                    <Button
                                      variant="ghost" size="sm" className="h-8 text-[10px]"
                                      onClick={() => updateStatus(item.id, prevStatus)}
                                      title={`Move back to ${STATUS_LABELS[prevStatus]}`}
                                    >
                                      <ArrowLeft className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {(status === "DRAFT" || (status === "MATCHED" && !item.matchedProgramId)) && (
                                    <Button size="sm" className="h-8 text-[10px]" onClick={() => openMatchModal(item)}>
                                      <Search className="h-3 w-3 mr-1" />Find Program
                                    </Button>
                                  )}
                                  {status === "MATCHED" && item.matchedProgramId && (
                                    <Button
                                      size="sm" className="h-8 text-[10px]" variant="default"
                                      onClick={() => { setShowBookModal(item); setBookPax(item.targetCount); setBookDate(`${viewYear}-${String(item.targetMonth + 1).padStart(2, "0")}-15`); }}
                                    >
                                      <Calendar className="h-3 w-3 mr-1" />Book Now
                                    </Button>
                                  )}
                                  {status === "SCHEDULED" && (
                                    <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={() => updateStatus(item.id, "COMPLETED")}>
                                      <CheckCircle2 className="h-3 w-3 mr-1" />Complete
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost" size="sm" className="h-8 text-[10px] text-red-500"
                                    onClick={() => updateStatus(item.id, "CANCELLED")}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══════════ ADD PLAN MODAL ═══════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="bg-card rounded-xl border shadow-2xl modal-content w-full max-w-lg mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add Training Plan</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Title *</label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. ABAC Compliance Training" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select className="w-full rounded-lg border px-3 py-2 text-sm bg-card" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <select className="w-full rounded-lg border px-3 py-2 text-sm bg-card" value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <Input value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="e.g. Finance" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Target Employees</label>
                  <Input type="number" value={newCount} onChange={(e) => setNewCount(parseInt(e.target.value) || 0)} min={1} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Target Month</label>
                  <select className="w-full rounded-lg border px-3 py-2 text-sm bg-card" value={newMonth} onChange={(e) => setNewMonth(parseInt(e.target.value))}>
                    {MONTHS_FULL.map((m, i) => <option key={i} value={i}>{m} {viewYear}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Estimated Cost (RM)</label>
                  <Input type="number" value={newCost} onChange={(e) => setNewCost(parseInt(e.target.value) || 0)} min={0} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <Input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Optional notes..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={addPlanItem} disabled={!newTitle.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Add to Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ BOOK NOW MODAL ═══════════ */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 modal-backdrop" onClick={() => setShowBookModal(null)}>
          <div className="bg-card rounded-xl border shadow-2xl modal-content w-full max-w-lg mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold"><Calendar className="h-5 w-5 inline mr-2" />Book Training</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowBookModal(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border p-3 bg-accent/20">
                <p className="text-sm font-semibold">{showBookModal.title}</p>
                <p className="text-xs text-muted-foreground">
                  {showBookModal.category} · {showBookModal.targetCount} pax · RM {showBookModal.estimatedCost.toLocaleString()} estimated
                </p>
                {showBookModal.matchedProgramId && (
                  <Badge variant="outline" className="mt-1 text-[10px]">Program matched — ready to book</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Training Date</label>
                  <Input type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Participants</label>
                  <Input type="number" value={bookPax} onChange={(e) => setBookPax(parseInt(e.target.value) || 0)} min={1} />
                </div>
              </div>

              {/* Conflict check */}
              {bookDate && (
                <div className="text-xs space-y-1">
                  {isPublicHoliday(bookDate) && (
                    <p className="text-red-600"><AlertTriangle className="h-3.5 w-3.5 inline mr-1" />Public holiday: {isPublicHoliday(bookDate)?.name}</p>
                  )}
                  {isBlackoutPeriod(bookDate) && (
                    <p className="text-red-600"><Ban className="h-3.5 w-3.5 inline mr-1" />Blackout period: {isBlackoutPeriod(bookDate)} — avoid this date</p>
                  )}
                  {getActivePeriods(bookDate).filter(p => p.affectsWork).map(p => (
                    <p key={p.name} className="text-amber-600"><Pin className="h-3.5 w-3.5 inline mr-1" />{p.name}: {p.description}</p>
                  ))}
                  {!isPublicHoliday(bookDate) && !isBlackoutPeriod(bookDate) && getActivePeriods(bookDate).filter(p => p.affectsWork).length === 0 && (
                    <p className="text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />No scheduling conflicts detected</p>
                  )}
                </div>
              )}

              {/* Cost preview */}
              {showBookModal.matchedProgramId && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-3">
                  <p className="text-xs font-semibold text-emerald-700">Cost Preview</p>
                  <p className="text-xs text-emerald-600">
                    {bookPax || showBookModal.targetCount} pax × program rate = ~RM {showBookModal.estimatedCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-600">HRDF Claimable: Up to RM {showBookModal.estimatedCost.toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowBookModal(null)}>Cancel</Button>
              <Button
                onClick={() => oneClickBook(showBookModal)}
                disabled={bookingInProgress || !showBookModal.matchedProgramId}
              >
                {bookingInProgress ? "Booking..." : <><Calendar className="h-3.5 w-3.5 inline mr-1" />Confirm & Book</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MATCH PROGRAM MODAL ═══════════ */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 modal-backdrop" onClick={() => setShowMatchModal(null)}>
          <div className="bg-card rounded-xl border shadow-2xl modal-content w-full max-w-2xl mx-4 p-6 space-y-4 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold"><Search className="h-5 w-5 inline mr-2" />Find a Program</h3>
                <p className="text-xs text-muted-foreground">Match "{showMatchModal.title}" to a marketplace program</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowMatchModal(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Plan item context */}
            <div className="rounded-lg border p-3 bg-accent/20 flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-[10px] ${CATEGORY_COLORS[showMatchModal.category]?.split(" ")[0] || ""} ${CATEGORY_COLORS[showMatchModal.category]?.split(" ")[1] || ""}`}>{showMatchModal.category}</Badge>
                <span className="text-sm font-medium">{showMatchModal.title}</span>
                <span className="text-xs text-muted-foreground">{showMatchModal.targetCount} pax · {MONTHS[showMatchModal.targetMonth]}</span>
              </div>
            </div>

            {/* Search + Filter */}
            <div className="flex gap-2 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={matchSearch}
                  onChange={(e) => { setMatchSearch(e.target.value); }}
                  onKeyDown={(e) => e.key === "Enter" && searchMarketPrograms()}
                  placeholder="Search programs..."
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <select
                className="rounded-lg border px-3 py-1 text-sm bg-card h-9"
                value={matchCategory}
                onChange={(e) => { setMatchCategory(e.target.value); }}
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <Button size="sm" className="h-9" onClick={searchMarketPrograms}>
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {matchLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                </div>
              ) : marketPrograms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No programs found. Try a different search or{" "}
                  <Link href="/hr/marketplace" className="text-primary hover:underline">browse the full marketplace</Link>.
                </p>
              ) : (
                marketPrograms.map((prog: any) => (
                  <button
                    key={prog.id}
                    onClick={() => matchProgramToItem(showMatchModal.id, prog.id, prog.title, prog.pricePerPax * showMatchModal.targetCount)}
                    className="w-full text-left rounded-lg border p-3 hover:border-primary hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`text-[9px] ${CATEGORY_COLORS[prog.category]?.split(" ")[0] || ""} ${CATEGORY_COLORS[prog.category]?.split(" ")[1] || ""}`}>
                            {prog.category}
                          </Badge>
                          <span className="text-sm font-semibold">{prog.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{prog.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span>👤 {prog.trainerName}</span>
                          {prog.trainerRating > 0 && <span>⭐ {prog.trainerRating.toFixed(1)}</span>}
                          {prog.accreditations && prog.accreditations.length > 0 && prog.accreditations.slice(0, 2).map((acc: string) => (
                            <span key={acc} className="text-[8px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-200">{acc}</span>
                          ))}
                          <span>⏱️ {prog.durationHours}h</span>
                          <span>📍 {prog.locationType}</span>
                          <span className="font-semibold text-foreground">RM {prog.pricePerPax}/pax</span>
                        </div>
                        <p className="text-[10px] text-primary mt-1">
                          Est. total: RM {(prog.pricePerPax * showMatchModal.targetCount).toLocaleString()} ({showMatchModal.targetCount} pax × RM {prog.pricePerPax})
                        </p>
                      </div>
                      <span className="text-primary text-lg flex-shrink-0">+</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-between flex-shrink-0 pt-2 border-t">
              <Link href="/hr/marketplace" className="text-xs text-primary hover:underline self-center">
                Browse full marketplace →
              </Link>
              <Button variant="outline" size="sm" onClick={() => setShowMatchModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────

function PlannerSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="space-y-4">
        {[0, 1].map((q) => (
          <div key={q} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((o) => (
              <Skeleton key={o} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
