"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/Toast";
import { CheckCircle2, XCircle, Search, Eye, FileText, Calendar, Users, MapPin, Building2, Upload, HelpCircle } from "lucide-react";
import { WorkflowGuideModal } from "@/components/WorkflowGuideModal";

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  SUBMITTED: "secondary", REVIEWING: "outline", APPROVED: "default", REJECTED: "destructive",
  HRDF_SUBMITTED: "default", COMPLETED: "default",
};

export default function AdminTeamBuilding() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const params = filter !== "ALL" ? `?status=${filter}` : "";
    fetch(`/api/admin/team-building${params}`)
      .then(r => r.json()).then(setRequests).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  async function updateStatus(id: string, data: any) {
    const res = await fetch(`/api/admin/team-building/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      setSelected(null); setNote("");
      toast("Updated", "success");
    }
  }

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>, reqId: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      await updateStatus(reqId, { trainerDocumentsUrl: url });
      toast("Document uploaded", "success");
    } else {
      toast("Upload failed", "error");
    }
    setUploading(false);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Team Building Requests</h1>
            <p className="text-muted-foreground mt-1">{requests.length} requests — Review, approve, and generate proposals</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowGuide(true)}>
            <HelpCircle className="h-4 w-4 mr-1"/> View Process Guide
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["ALL", "SUBMITTED", "REVIEWING", "APPROVED", "REJECTED", "COMPLETED"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${filter === s ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"}`}>
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {requests.map(req => (
          <Card key={req.id} className={`cursor-pointer border hover:border-primary/40 transition-all ${selected?.id === req.id ? "border-primary ring-1 ring-primary" : ""}`}
            onClick={() => setSelected(selected?.id === req.id ? null : req)}>
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-base">{req.activityName || "Team Building"}</p>
                    <Badge variant={statusColors[req.status] || "secondary"} className="text-xs px-2 py-0.5">{req.status}</Badge>
                    <Badge variant="outline" className="text-xs px-2 py-0.5">{req.activityCategory}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {req.companyName} • {req.hrName} • {req.teamSize} pax • {new Date(req.startDate).toLocaleDateString("en-MY")}
                    {req.isConsecutive ? ` (${req.batchCount} days)` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-base font-semibold">RM {req.totalCost?.toLocaleString()}</span>
                  <Eye className="h-5 w-5 text-muted-foreground"/>
                </div>
              </div>

              {/* Expanded view */}
              {selected?.id === req.id && (
                <div className="mt-5 pt-5 border-t space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground"/>HQ: {req.hqLocation}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground"/>Venue: {req.venueName}</div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/>Date: {new Date(req.startDate).toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" })}</div>
                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground"/>Ages: {req.avgAge} ({req.ageMin}-{req.ageMax})</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-muted/30">
                    <div><span className="text-sm text-muted-foreground">Activity Cost</span><p className="font-semibold text-base mt-0.5">RM {req.activityCost?.toLocaleString()}</p></div>
                    <div><span className="text-sm text-muted-foreground">Accommodation</span><p className="font-semibold text-base mt-0.5">RM {req.accommodationCost?.toLocaleString()}</p></div>
                    <div><span className="text-sm text-muted-foreground">HRDF Claimable</span><p className="font-semibold text-base mt-0.5">RM {req.hrdfClaimable?.toLocaleString()}</p></div>
                  </div>

                  {/* Attached Documents */}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-2">📎 Documents</p>
                    {req.trainerDocumentsUrl ? (
                      <a href={req.trainerDocumentsUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 rounded-lg px-4 py-2.5">
                        <FileText className="h-4 w-4"/> View Attached Document
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-2">No documents attached yet</p>
                    )}
                    <label className="inline-flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer ml-4">
                      <Upload className="h-4 w-4"/> {uploading ? "Uploading..." : "Upload PDF"}
                      <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" onChange={(e) => handleDocUpload(e, req.id)} disabled={uploading}/>
                    </label>
                  </div>

                  {/* Admin actions */}
                  {(req.status === "SUBMITTED" || req.status === "REVIEWING") && (
                    <div className="space-y-3 pt-4 border-t">
                      <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Admin notes (optional)..." className="h-10 text-sm"/>
                      <div className="flex gap-3">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateStatus(req.id, { status: "REVIEWING", adminNotes: note }); }}>
                          🔍 Mark as Reviewing
                        </Button>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); updateStatus(req.id, { status: "APPROVED", adminNotes: note }); }}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1"/> Approve & Send Proposal
                        </Button>
                        <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); updateStatus(req.id, { status: "REJECTED", adminNotes: note }); }}>
                          <XCircle className="h-3.5 w-3.5 mr-1"/> Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {req.status === "APPROVED" && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground">🏛️ HRDF Claim Submission (both parties may need to submit)</p>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Employer side */}
                        <div className="rounded-lg border p-3 space-y-2">
                          <p className="text-xs font-semibold">🏢 Employer (HR)</p>
                          <Badge variant={req.employerHrdfSubmitted ? "default" : "secondary"} className="text-[10px]">
                            {req.employerHrdfSubmitted ? "✅ Submitted" : "⏳ Pending"}
                          </Badge>
                          {req.employerHrdfSubmitted && req.employerHrdfSubmittedAt && (
                            <p className="text-[10px] text-muted-foreground">{new Date(req.employerHrdfSubmittedAt).toLocaleDateString("en-MY")}</p>
                          )}
                          {!req.employerHrdfSubmitted && (
                            <Button size="sm" variant="outline" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); updateStatus(req.id, { employerHrdfSubmitted: true }); }}>
                              Mark Employer Submitted
                            </Button>
                          )}
                        </div>
                        {/* Trainer side */}
                        <div className="rounded-lg border p-3 space-y-2">
                          <p className="text-xs font-semibold">👨‍🏫 Trainer / Provider</p>
                          <Badge variant={req.trainerHrdfSubmitted ? "default" : "secondary"} className="text-[10px]">
                            {req.trainerHrdfSubmitted ? "✅ Submitted" : "⏳ Pending"}
                          </Badge>
                          {req.trainerHrdfSubmitted && req.trainerHrdfSubmittedAt && (
                            <p className="text-[10px] text-muted-foreground">{new Date(req.trainerHrdfSubmittedAt).toLocaleDateString("en-MY")}</p>
                          )}
                          {!req.trainerHrdfSubmitted && (
                            <Button size="sm" variant="outline" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); updateStatus(req.id, { trainerHrdfSubmitted: true }); }}>
                              Mark Trainer Submitted
                            </Button>
                          )}
                        </div>
                      </div>
                      <Button size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); updateStatus(req.id, { status: "COMPLETED" }); }}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1"/> Mark as Complete
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {!loading && requests.length === 0 && (
          <Card><CardContent className="py-16 text-center text-muted-foreground">No team building requests yet.</CardContent></Card>
        )}
      </div>

      <WorkflowGuideModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
        role="ADMIN"
        status={selected?.status || "SUBMITTED"}
        employerHrdfSubmitted={selected?.employerHrdfSubmitted || false}
        trainerHrdfSubmitted={selected?.trainerHrdfSubmitted || false}
        requestType="Team Building"
      />
    </div>
  );
}
