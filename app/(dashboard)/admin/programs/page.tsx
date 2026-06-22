"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import {
  Search, Star, Eye, EyeOff, Archive, CheckCircle2, BookMarked,
} from "lucide-react";

interface ProgramItem {
  id: string;
  title: string;
  category: string;
  status: string;
  featured: boolean;
  pricePerPax: number;
  durationHours: number;
  locationType: string;
  maxParticipants: number;
  trainerId: string;
  trainerName: string;
  trainerEmail: string;
  bookingCount: number;
  moduleCount: number;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ["All", "Leadership", "Technical", "Soft Skills", "Compliance", "Team Building", "HR Operations"];
const STATUSES = ["All", "DRAFT", "PUBLISHED", "ARCHIVED"];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-red-100 text-red-700",
};

const CATEGORY_COLORS: Record<string, string> = {
  Leadership: "bg-red-100 text-red-700", Technical: "bg-emerald-100 text-emerald-700",
  "Soft Skills": "bg-violet-100 text-violet-700", Compliance: "bg-amber-100 text-amber-700",
  "Team Building": "bg-rose-100 text-rose-700", "HR Operations": "bg-cyan-100 text-cyan-700",
};

export default function AdminProgramsPage() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (status !== "All") params.set("status", status);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/admin/programs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPrograms(data.programs || []);
        setStatusCounts(data.statusCounts || {});
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [category, status, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function quickAction(id: string, action: string) {
    // Optimistic UI update
    setPrograms((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      if (action === "feature") return { ...p, featured: !p.featured };
      if (action === "publish") return { ...p, status: "PUBLISHED" };
      if (action === "archive") return { ...p, status: "ARCHIVED" };
      if (action === "draft") return { ...p, status: "DRAFT" };
      return p;
    }));

    try {
      const res = await fetch("/api/admin/programs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error || `Failed to ${action}`, "error");
        fetchData(); // revert on failure
      } else {
        toast(`Program ${action}ed`, "success");
      }
    } catch {
      toast("Network error", "error");
      fetchData();
    }
  }

  if (loading) return <ProgramsSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
        <p className="text-muted-foreground">Manage all programs across trainers</p>
      </div>

      {/* Status counts */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setStatus("All")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${status === "All" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}>
          All ({programs.length})
        </button>
        {["PUBLISHED", "DRAFT", "ARCHIVED"].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${status === s ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}>
            {s} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search programs..." className="pl-9" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm bg-card">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={fetchData}>Filter</Button>
      </div>

      {/* Program list */}
      {programs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookMarked className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No programs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {programs.map((p, idx) => (
            <div key={p.id} className={`stagger-item stagger-${Math.min(idx + 1, 10)}`}>
            <div className="flex items-center justify-between rounded-xl border px-5 py-4 hover:bg-accent/20 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge className={`text-[10px] ${CATEGORY_COLORS[p.category] || ""}`}>{p.category}</Badge>
                  <Badge className={`text-[10px] ${STATUS_COLORS[p.status] || ""}`}>{p.status}</Badge>
                  {p.featured && <Badge className="text-[10px] bg-amber-100 text-amber-700">⭐ Featured</Badge>}
                </div>
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {p.trainerName} · {p.durationHours}h · RM {p.pricePerPax}/pax · {p.locationType} · max {p.maxParticipants}
                  {" · "}{p.bookingCount} bookings · {p.moduleCount} modules
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                {/* Feature toggle */}
                <Button variant="ghost" size="sm" className="h-8 text-xs"
                  onClick={() => quickAction(p.id, "feature")}
                  title={p.featured ? "Unfeature" : "Feature"}>
                  <Star className={`h-4 w-4 ${p.featured ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                </Button>
                {/* Publish/Unpublish */}
                {p.status !== "PUBLISHED" && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-emerald-600"
                    onClick={() => quickAction(p.id, "publish")} title="Publish">
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
                {p.status === "PUBLISHED" && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground"
                    onClick={() => quickAction(p.id, "archive")} title="Archive">
                    <Archive className="h-4 w-4" />
                  </Button>
                )}
                {p.status === "ARCHIVED" && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-600"
                    onClick={() => quickAction(p.id, "draft")} title="Move to Draft">
                    <EyeOff className="h-4 w-4" />
                  </Button>
                )}
                {/* View / Expand */}
                <Button variant="ghost" size="sm" className="h-8 text-xs"
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                  {expandedId === p.id ? "Hide" : "View"}
                </Button>
              </div>
            </div>
            {/* Expanded detail */}
            {expandedId === p.id && (
              <div className="px-5 pb-4 pt-0 border-t mt-2">
                <div className="grid gap-2 sm:grid-cols-3 mt-3 text-xs">
                  <div><span className="text-muted-foreground">Trainer:</span> <span className="font-medium">{p.trainerName}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{p.trainerEmail}</span></div>
                  <div><span className="text-muted-foreground">Location:</span> <span className="font-medium capitalize">{p.locationType}</span></div>
                  <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{p.durationHours}h</span></div>
                  <div><span className="text-muted-foreground">Max Participants:</span> <span className="font-medium">{p.maxParticipants}</span></div>
                  <div><span className="text-muted-foreground">Price per Pax:</span> <span className="font-medium">RM {p.pricePerPax.toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Bookings:</span> <span className="font-medium">{p.bookingCount}</span></div>
                  <div><span className="text-muted-foreground">Modules:</span> <span className="font-medium">{p.moduleCount}</span></div>
                  <div><span className="text-muted-foreground">Created:</span> <span className="font-medium">{new Date(p.createdAt).toLocaleDateString("en-MY")}</span></div>
                </div>
              </div>
            )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgramsSkeleton() {
  return (
    <div className="space-y-6">
      <div><Skeleton className="h-8 w-40 mb-1" /><Skeleton className="h-4 w-64" /></div>
      <div className="flex gap-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}</div>
      <div className="flex gap-3"><Skeleton className="h-10 flex-1 rounded-lg" /><Skeleton className="h-10 w-32 rounded-lg" /></div>
      <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
    </div>
  );
}
