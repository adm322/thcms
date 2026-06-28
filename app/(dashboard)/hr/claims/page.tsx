"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/Toast";
import { ExportButton } from "@/components/ExportButton";
import { Receipt, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface ClaimRecord { id: string; employeeName: string; department: string; type: string; amount: number; description: string | null; receiptUrl: string | null; status: string; createdAt: string; }
const typeLabels: Record<string, string> = { MILEAGE: "Mileage", TRAVEL: "Travel", MEAL: "Meal", MEDICAL: "Medical", OPTICAL: "Optical", DENTAL: "Dental", OTHER: "Other" };
const statusColors: Record<string, "status-success" | "status-info" | "status-warning" | "status-danger" | "status-neutral"> = { APPROVED: "status-success", PENDING: "status-warning", REJECTED: "status-danger", PAID: "status-success" };

export default function HRClaims() {
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (filter !== "ALL") params.set("status", filter);
    fetch(`/api/hr/claims?${params}`)
      .then(r => r.json()).then(d => { setClaims(d.data || []); setTotalPages(d.pagination?.totalPages || 1); })
      .catch(console.error).finally(() => setLoading(false));
  }, [page, filter]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/hr/claims/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) { setClaims(prev => prev.map(c => c.id === id ? { ...c, status } : c)); toast(`Claim ${status.toLowerCase()}`, "success"); }
    else toast("Failed to update", "error");
  }

  const totalAmount = claims.filter(c => c.status === "APPROVED" || c.status === "PAID").reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">Claims</h1><p className="text-muted-foreground">RM {totalAmount.toLocaleString()} approved/paid</p></div>
        <div className="flex items-center gap-2">
          <ExportButton apiUrl="/api/hr/claims" filename="claims.csv" />
          {["ALL","PENDING","APPROVED","PAID","REJECTED"].map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }} className={`rounded-full px-3 py-1 text-xs font-medium ${filter === s ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"}`}>{s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Card key={i}><CardContent className="flex items-center justify-between py-4"><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /></CardContent></Card>)}</div>
      ) : claims.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16"><Receipt className="mb-4 h-12 w-12 text-muted-foreground/40" /><h3 className="text-lg font-semibold">No claims</h3><p className="text-sm text-muted-foreground">Employee expense claims will appear here</p></CardContent></Card>
      ) : (
        <>
          <div className="space-y-2">
            {claims.map(c => (
              <Card key={c.id}><CardContent className="flex items-center justify-between py-4 flex-wrap gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><p className="font-medium">{c.employeeName}</p><Badge variant="outline" className="text-[10px]">{c.department}</Badge></div>
                  <p className="text-sm text-muted-foreground">{typeLabels[c.type] || c.type} • {c.description || "—"}</p>
                  {c.receiptUrl && <a href={c.receiptUrl} target="_blank" className="text-xs text-primary hover:underline">View receipt</a>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-semibold">RM {c.amount.toFixed(2)}</span>
                  <Badge variant={statusColors[c.status] || "secondary"}>{c.status}</Badge>
                  {c.status === "PENDING" && (<>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(c.id, "APPROVED")}><CheckCircle2 className="h-3 w-3 mr-1" />Approve</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => updateStatus(c.id, "REJECTED")}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                  </>)}
                </div>
              </CardContent></Card>
            ))}
          </div>
          {totalPages > 1 && (<div className="flex items-center justify-center gap-2"><Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(page-1)}><ChevronLeft className="h-4 w-4 mr-1"/>Prev</Button><span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span><Button variant="outline" size="sm" disabled={page>=totalPages} onClick={()=>setPage(page+1)}>Next<ChevronRight className="h-4 w-4 ml-1"/></Button></div>)}
        </>
      )}
    </div>
  );
}
