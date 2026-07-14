"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/Toast";
import { ExportButton } from "@/components/ExportButton";
import { Calendar, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface LeaveRecord {
  id: string;
  employeeName: string;
  department: string;
  position: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason: string | null;
  approvedByName: string | null;
  createdAt: string;
}

const leaveTypeLabels: Record<string, string> = {
  ANNUAL: "Annual Leave", MEDICAL: "Medical", EMERGENCY: "Emergency",
  UNPAID: "Unpaid", HOSPITALISATION: "Hospitalisation", MATERNITY: "Maternity",
  PATERNITY: "Paternity", HAJJ: "Hajj", COMPASSIONATE: "Compassionate", MARRIAGE: "Marriage",
};

const statusColors: Record<string, "status-success" | "status-info" | "status-warning" | "status-danger" | "status-neutral"> = {
  APPROVED: "status-success", PENDING: "status-warning", REJECTED: "status-danger", CANCELLED: "status-neutral",
};

export default function HRLeaves() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (filter !== "ALL") params.set("status", filter);
    fetch(`/api/hr/leaves?${params}`)
      .then(r => r.json())
      .then(d => { setLeaves(d.data || []); setTotalPages(d.pagination?.totalPages || 1); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, filter]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/hr/leaves/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      toast(`Leave ${status.toLowerCase()}`, "success");
    } else {
      toast("Failed to update leave", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">Approve, reject, and manage employee leave requests</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton apiUrl="/api/hr/leaves" filename="leaves.csv" />
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filter === s ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"}`}>
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <Card key={i}><CardContent className="flex items-center justify-between py-4"><Skeleton className="h-4 w-48" /><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-16 rounded-full" /></CardContent></Card>
          ))}
        </div>
      ) : leaves.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16 text-center"><Calendar className="mb-4 h-12 w-12 text-muted-foreground/40" /><h3 className="text-lg font-semibold">No leave records</h3><p className="text-sm text-muted-foreground">Employee leave requests will appear here</p></CardContent></Card>
      ) : (
        <>
          <div className="space-y-2">
            {leaves.map(l => (
              <Card key={l.id}>
                <CardContent className="flex items-center justify-between py-4 flex-wrap gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{l.employeeName}</p>
                      <Badge variant="outline" className="text-[10px]">{l.department}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {leaveTypeLabels[l.type] || l.type} • {l.days} day{l.days > 1 ? "s" : ""} • {new Date(l.startDate).toLocaleDateString("en-MY")} – {new Date(l.endDate).toLocaleDateString("en-MY")}
                    </p>
                    {l.reason && <p className="text-xs text-muted-foreground mt-0.5">"{l.reason}"</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={statusColors[l.status] || "secondary"}>{l.status}</Badge>
                    {l.status === "PENDING" && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(l.id, "APPROVED")}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => updateStatus(l.id, "REJECTED")}>
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4 mr-1" />Prev</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next<ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
