"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, Plus, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const CATEGORIES = ["GENERAL", "TECHNICAL", "BILLING", "TRAINING", "FEATURE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const statusIcons: Record<string, typeof CheckCircle2> = {
  OPEN: Clock, IN_PROGRESS: AlertTriangle, RESOLVED: CheckCircle2, CLOSED: XCircle,
};
const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700", IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700", CLOSED: "bg-slate-100 text-slate-700",
};
const priorityColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  LOW: "outline", MEDIUM: "secondary", HIGH: "default", URGENT: "destructive",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/hr/support").then((r) => r.json()).then(setTickets).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function createTicket() {
    if (!subject.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/hr/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, description, category, priority }),
    });
    if (res.ok) {
      const t = await res.json();
      setTickets((prev) => [t, ...prev]);
      setOpen(false);
      setSubject(""); setDescription(""); setCategory("GENERAL"); setPriority("MEDIUM");
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">Submit and track support requests</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Ticket
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading...</div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No tickets yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Create a support ticket for help with the platform.</p>
            <Button className="mt-4" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => {
            const Icon = statusIcons[t.status] || Clock;
            return (
              <Card key={t.id} className="hover:bg-accent/30 transition-colors cursor-pointer">
                <CardContent className="flex items-start gap-4 py-4">
                  <div className={`flex-shrink-0 rounded-full p-2 ${statusColors[t.status]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{t.subject}</p>
                      <Badge variant={priorityColors[t.priority]} className="text-[10px]">{t.priority}</Badge>
                      <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description || "No description"}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Created {new Date(t.createdAt).toLocaleDateString("en-MY")}
                      {t.adminNotes && ` • Admin: ${t.adminNotes}`}
                    </p>
                  </div>
                  <Badge className={statusColors[t.status]}>{t.status.replace("_", " ")}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Ticket Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description of your issue" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Details about your request..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <div className="flex flex-wrap gap-1">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setCategory(c)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                        category === c ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <div className="flex flex-wrap gap-1">
                  {PRIORITIES.map((p) => (
                    <button key={p} onClick={() => setPriority(p)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                        priority === p ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createTicket} disabled={!subject.trim() || submitting}>
              {submitting ? "Creating..." : "Submit Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
