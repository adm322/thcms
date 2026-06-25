"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import { CheckSquare, XSquare, ChevronRight } from "lucide-react";

interface BookingRow { id: string; programTitle: string; companyName: string; trainerName: string; date: string; status: string; totalFee: number; depositStatus: string; employerHrdfSubmitted?: boolean; participantCount: number; venueAddress: string | null; }
const statusBadge: Record<string, "default" | "secondary" | "outline" | "destructive"> = { PENDING: "secondary", CONFIRMED: "default", COMPLETED: "outline", CANCELLED: "destructive" };

export default function AdminBookings() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/bookings?page=${page}&limit=20`)
      .then(r => r.json()).then(d => {
        setBookings(d.data || d);
        if (d.pagination) setTotalPages(d.pagination.totalPages);
      }).catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = filter === "ALL" ? bookings : bookings.filter(b => b.status === filter);

  function toggleSelect(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }
  function selectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(b => b.id)));
  }

  async function bulkAction(status: string) {
    await fetch("/api/admin/bookings/batch", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], status }),
    });
    setBookings(prev => prev.map(b => selected.has(b.id) ? { ...b, status } : b));
    setSelected(new Set());
    toast(`${selected.size} bookings ${status.toLowerCase()}`, "success");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight">All Bookings</h1>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <Button size="sm" onClick={() => bulkAction("CONFIRMED")}><CheckSquare className="mr-1 h-3.5 w-3.5" />Approve</Button>
            <Button size="sm" variant="destructive" onClick={() => bulkAction("CANCELLED")}><XSquare className="mr-1 h-3.5 w-3.5" />Reject</Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium ${filter === s ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"}`}>{s}</button>
        ))}
        <button onClick={selectAll} className="ml-2 text-xs text-muted-foreground hover:text-foreground">
          {selected.size === filtered.length && filtered.length > 0 ? "Deselect All" : "Select All"}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
              <Card className="flex-1">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <div key={b.id} className="flex items-center gap-3">
              <Checkbox checked={selected.has(b.id)} onCheckedChange={() => toggleSelect(b.id)} className="flex-shrink-0" />
              <Link href={`/admin/bookings/${b.id}`} className="flex-1">
                <Card className="group cursor-pointer border hover:border-primary/40 hover:shadow-sm transition-all">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">{b.programTitle}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">{b.companyName}</span> · {b.trainerName}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(b.date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })} · {b.participantCount} pax · <span className="capitalize">{b.venueAddress}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border w-full sm:w-auto flex-shrink-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {b.status === "COMPLETED" && !b.employerHrdfSubmitted && (
                          <Badge variant="destructive" className="text-[9px] font-mono tracking-wider uppercase py-0.5 px-2 rounded-full animate-pulse">
                            ⚠️ Claim pending
                          </Badge>
                        )}
                        {b.status === "CONFIRMED" && (
                          <Badge variant="secondary" className="text-[9px] font-mono tracking-wider uppercase py-0.5 px-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200">
                            🏛️ Grant approved
                          </Badge>
                        )}
                        <Badge variant={statusBadge[b.status] || "secondary"} className="text-[10px] font-mono tracking-wider uppercase py-0.5 px-2 rounded-full">{b.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground font-mono">RM {b.totalFee.toLocaleString()}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
