"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react";

const statusIcons: Record<string, typeof CheckCircle2> = { OPEN: Clock, IN_PROGRESS: AlertCircle, RESOLVED: CheckCircle2, CLOSED: XCircle };
const statusColors: Record<string, string> = { OPEN: "bg-blue-100 text-blue-700", IN_PROGRESS: "bg-amber-100 text-amber-700", RESOLVED: "bg-emerald-100 text-emerald-700", CLOSED: "bg-slate-100 text-slate-700" };

export default function AdminSupport() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/support").then((r) => r.json()).then(setTickets).catch(console.error);
  }, []);

  async function updateTicket(id: string, status: string) {
    await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, adminNotes: notes || undefined }),
    });
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status, adminNotes: notes || t.adminNotes } : t)));
    setOpen(false);
    setNotes("");
    setSelected(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-muted-foreground">Manage all support requests from HR departments</p>
      </div>

      <div className="space-y-2">
        {tickets.map((t) => {
          const Icon = statusIcons[t.status] || Clock;
          return (
            <Card key={t.id} className="cursor-pointer hover:bg-accent/30" onClick={() => { setSelected(t); setNotes(t.adminNotes || ""); setOpen(true); }}>
              <CardContent className="flex items-start gap-4 py-4">
                <div className={`rounded-full p-2 flex-shrink-0 ${statusColors[t.status]}`}><Icon className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{t.subject}</p>
                    <Badge variant="outline" className="text-[10px]">{t.priority}</Badge>
                    <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t.hr?.name || "Unknown"} • {t.company?.name || ""}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("en-MY")}</p>
                </div>
                <Badge className={statusColors[t.status]}>{t.status.replace("_", " ")}</Badge>
              </CardContent>
            </Card>
          );
        })}
        {tickets.length === 0 && (
          <Card><CardContent className="flex flex-col items-center py-16 text-center"><MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/40" /><p className="text-muted-foreground">No support tickets yet.</p></CardContent></Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{selected?.subject}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p><strong>From:</strong> {selected?.hr?.name} ({selected?.hr?.email})</p>
            <p><strong>Company:</strong> {selected?.company?.name}</p>
            <p><strong>Priority:</strong> {selected?.priority} • <strong>Category:</strong> {selected?.category}</p>
            <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Description</p><p className="mt-1 whitespace-pre-wrap">{selected?.description || "No description"}</p></div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Add notes for the HR team..." />
            </div>
          </div>
          <DialogFooter className="flex gap-2 flex-wrap">
            {selected?.status === "OPEN" && (
              <Button size="sm" onClick={() => updateTicket(selected.id, "IN_PROGRESS")}>Mark In Progress</Button>
            )}
            {selected?.status === "IN_PROGRESS" && (
              <Button size="sm" onClick={() => updateTicket(selected.id, "RESOLVED")}>Resolve</Button>
            )}
            {(selected?.status === "OPEN" || selected?.status === "IN_PROGRESS") && (
              <Button size="sm" variant="outline" onClick={() => updateTicket(selected.id, "CLOSED")}>Close</Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
