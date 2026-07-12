"use client";
import Link from "next/link";

import { useState, useEffect, use, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Calendar, DollarSign, Users, Landmark, Building2, CreditCard, MapPin, Clock, QrCode, ImageDown } from "lucide-react";

export default function AdminBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/admin/bookings/${id}`).then(r => r.json()).then(setBooking).catch(console.error);
  }, [id]);

  const [showQR, setShowQR] = useState(false);
  const [openParticipants, setOpenParticipants] = useState(true);
  const [openChecklist, setOpenChecklist] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrUrl = typeof window !== "undefined" ? `${window.location.origin}/api/attendance/${id}` : "";

  // ponytail: generate QR after canvas mounts
  useEffect(() => {
    if (showQR && canvasRef.current) {
      import("qrcode").then(({ default: QRCode }) => {
        QRCode.toCanvas(canvasRef.current!, qrUrl, { width: 200 });
      });
    }
  }, [showQR, qrUrl]);

  function downloadQRImg() {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = "attendance-qr.png";
    a.click();
  }

  if (!booking) return <div className="py-20 text-center text-muted-foreground"><Clock className="h-8 w-8 mx-auto mb-2 animate-spin" /><p>Loading...</p></div>;
  if (booking.error) return (
    <div className="py-20 text-center text-red-500">
      <h2 className="text-xl font-bold mb-2">Access Denied</h2>
      <p>{booking.error === "Not found" ? "This booking does not exist or you do not have permission to view it." : booking.error}</p>
      <Link href="/admin/bookings">
        <Button variant="outline" className="mt-6">Return to Bookings</Button>
      </Link>
    </div>
  );

  return (
    <div className="space-y-6 section-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">Booking Detail</h1>
            <Badge className={booking.status === "COMPLETED" ? "bg-blue-100 text-blue-700" : ""}>{booking.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <Building2 className="h-3.5 w-3.5 inline mr-1" />{booking.companyName}
            {" · "}{booking.programTitle}
          </p>
        </div>
        {/* Status actions */}
        {booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (
          <div className="flex gap-2">
            {booking.status === "PENDING" && (
              <>
                <Button size="sm" variant="default" onClick={() => updateStatus(booking.id, "CONFIRMED", setBooking)}>Confirm</Button>
                <Button size="sm" variant="outline" className="text-red-500" onClick={() => updateStatus(booking.id, "CANCELLED", setBooking)}>Cancel</Button>
              </>
            )}
            {booking.status === "CONFIRMED" && (
              <>
                <Button size="sm" variant="default" onClick={() => updateStatus(booking.id, "COMPLETED", setBooking)}>Mark Complete</Button>
                <a href={`/class/${id}`} target="_blank" rel="noopener">
                  <Button size="sm" variant="outline"><QrCode className="h-3.5 w-3.5 mr-1" />Class Mode</Button>
                </a>
                <Button size="sm" variant="outline" onClick={() => {
                  const count = booking.participants?.length || 0;
                  alert(`📧 Notification sent to ${count} participants for "${booking.programTitle}"`);
                }}>Notify Participants</Button>
                <Button size="sm" variant="outline" className="text-red-500" onClick={() => updateStatus(booking.id, "CANCELLED", setBooking)}>Cancel</Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Booking info — spans 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" />Booking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">Trainer:</span> <span className="font-medium">{booking.trainerName || "—"}</span></div>
                <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">Company:</span> <span className="font-medium">{booking.companyName || "—"}</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">Date:</span> <span className="font-medium">{new Date(booking.date).toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">Total Fee:</span> <span className="font-semibold">RM {booking.totalFee?.toLocaleString()}</span></div>
                <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">Deposit:</span> <span className="font-medium">RM {booking.depositPaid?.toLocaleString()}</span>{booking.depositPaid > 0 && <Badge variant="outline" className="text-[10px] text-emerald-600">PAID</Badge>}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">Venue:</span> <span className="font-medium">{booking.venuePreference === "online" ? "Online" : booking.venueAddress || "TBD"}</span></div>
                {booking.meetingLink && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Virtual Link:</span>
                    <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono truncate max-w-40 sm:max-w-none">
                      {booking.meetingLink}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* HRDF Tracking */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1.5"><Landmark className="h-3.5 w-3.5" />HRDF Claim Tracking</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className={`rounded-lg border p-3 flex items-center justify-between ${booking.employerHrdfSubmitted ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200" : "bg-amber-50 dark:bg-amber-950/30 border-amber-200"}`}>
                  <div><p className="text-xs font-medium flex items-center gap-1"><Building2 className="h-3 w-3" />Employer</p><p className="text-[10px] text-muted-foreground">{booking.employerHrdfSubmitted ? "Submitted" : "Not submitted"}</p></div>
                  <Badge variant={booking.employerHrdfSubmitted ? "default" : "secondary"} className="text-[10px]">{booking.employerHrdfSubmitted ? "Done" : "Pending"}</Badge>
                </div>
                <div className={`rounded-lg border p-3 flex items-center justify-between ${booking.trainerHrdfSubmitted ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200" : "bg-amber-50 dark:bg-amber-950/30 border-amber-200"}`}>
                  <div><p className="text-xs font-medium flex items-center gap-1"><User className="h-3 w-3" />Trainer Docs</p><p className="text-[10px] text-muted-foreground">{booking.trainerHrdfSubmitted ? "Uploaded" : "Not uploaded"}</p></div>
                  <Badge variant={booking.trainerHrdfSubmitted ? "default" : "secondary"} className="text-[10px]">{booking.trainerHrdfSubmitted ? "Done" : "Pending"}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants — collapsible */}
        <Card>
          <button onClick={() => setOpenParticipants(!openParticipants)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors rounded-t-xl">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />Participants ({booking.participants?.length || 0})</CardTitle>
            <div className="flex items-center gap-2">
              {booking.status === "CONFIRMED" && (
                <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); setShowQR(!showQR); }}>
                  <QrCode className="h-3.5 w-3.5 mr-1" />{showQR ? "Hide QR" : "Attendance QR"}
                </Button>
              )}
              <span className="text-xs text-muted-foreground">{openParticipants ? "▲" : "▼"}</span>
            </div>
          </button>
          {openParticipants && (
            <CardContent>
              {showQR && (
                <div className="mb-4 p-4 rounded-lg bg-muted/50 text-center">
                  <canvas ref={canvasRef} className="mx-auto rounded-lg bg-white p-2" /><div className="flex items-center justify-center gap-2 mt-2"><Button size="sm" variant="outline" className="text-[10px]" onClick={downloadQRImg}><ImageDown className="h-3 w-3 mr-1" />Download for Slides</Button></div>
                  <p className="text-[10px] text-muted-foreground break-all mt-1">{qrUrl}</p>
                </div>
              )}
              {booking.participants?.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No participants</p> : (
              <div className="space-y-1">
                {booking.participants?.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><User className="h-3.5 w-3.5 text-muted-foreground" /></div>
                      <div className="min-w-0"><p className="text-sm font-medium truncate">{p.name}</p>{p.email && <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>}</div>
                    </div>
                    <button
                      onClick={async () => {
                        const statuses = ["PENDING", "PRESENT", "ABSENT"];
                        const next = statuses[(statuses.indexOf(p.attendanceStatus) + 1) % 3];
                        await fetch(`/api/admin/bookings/${booking.id}/participants/${p.id}`, {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ attendanceStatus: next }),
                        });
                        // ponytail: simple refetch
                        const res = await fetch(`/api/admin/bookings/${id}`);
                        if (res.ok) setBooking(await res.json());
                      }}
                      className={`text-[10px] flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                        p.attendanceStatus === "PRESENT" ? "bg-emerald-100 text-emerald-700 border-emerald-300" :
                        p.attendanceStatus === "ABSENT" ? "bg-red-100 text-red-700 border-red-300" :
                        "bg-amber-100 text-amber-700 border-amber-300"
                      }`}
                    >
                      {p.attendanceStatus}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          )}
        </Card>

        {/* Training Checklist — collapsible */}
        {booking.status !== "CANCELLED" && (
          <Card>
            <button onClick={() => setOpenChecklist(!openChecklist)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors rounded-t-xl">
              <CardTitle className="text-base">Training Checklist</CardTitle>
              <span className="text-xs text-muted-foreground">{openChecklist ? "▲" : "▼"}</span>
            </button>
            {openChecklist && (
              <TrainingChecklist bookingId={booking.id} status={booking.status} date={booking.date} />
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

// ponytail: inline status update — no extra file
async function updateStatus(id: string, status: string, setBooking: any) {
  const res = await fetch(`/api/admin/bookings/${id}/status`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (res.ok) {
    const updated = await res.json();
    setBooking((prev: any) => ({ ...prev, status: updated.status || status }));
  }
}

function TrainingChecklist({ bookingId, status, date }: { bookingId: string; status: string; date: string }) {
  const [items, setItems] = useState<Record<string, boolean>>({});
  const key = `training-checklist-${bookingId}`;

  useEffect(() => { const saved = localStorage.getItem(key); if (saved) setItems(JSON.parse(saved)); }, [key]);

  function toggle(item: string) {
    const next = { ...items, [item]: !items[item] };
    setItems(next);
    localStorage.setItem(key, JSON.stringify(next));
  }

  const isPast = new Date(date) < new Date();
  const preItems = ["Training proposal & quotation received", "HRDF grant application submitted via e-TRiS", "Venue & catering confirmed", "Training materials printed", "Joining instructions sent to participants"];
  const duringItems = ["Attendance sheet (T3) signed daily", "Photos/videos taken during training", "Pre-test / post-test administered", "Evaluation forms distributed & collected", "Certificates of completion issued"];
  const postItems = ["Training completion report compiled", "Claim form submitted to HRDF via e-TRiS", "Invoice & receipts uploaded", "Attendance records uploaded", "Trainer profile & certificates uploaded"];
  const done = [...preItems, ...duringItems, ...postItems].filter(i => items[i]).length;
  const total = preItems.length + duringItems.length + postItems.length;

  return (
    <div>
      <div className="flex justify-between items-center px-1 mb-2"><span className="text-xs text-muted-foreground">{done}/{total} done</span></div>
      <CardContent className="space-y-4 px-0">
        <ChecklistGroup title="Pre-Training" items={preItems} state={items} onToggle={toggle} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/30" />
        {isPast && <ChecklistGroup title="During Training" items={duringItems} state={items} onToggle={toggle} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-950/30" />}
        {isPast && <ChecklistGroup title="Post-Training (HRDF Claim)" items={postItems} state={items} onToggle={toggle} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/30" />}
        {!isPast && <p className="text-xs text-muted-foreground italic">During & post-training checklists unlock after the training date</p>}
      </CardContent>
    </div>
  );
}

function ChecklistGroup({ title, items, state, onToggle, color, bg }: any) {
  const done = items.filter((i: string) => state[i]).length;
  return (
    <div className={`rounded-lg ${bg} p-3 space-y-1.5`}>
      <div className="flex items-center justify-between mb-1"><p className={`text-xs font-semibold ${color}`}>{title}</p><span className="text-[10px] text-muted-foreground">{done}/{items.length}</span></div>
      {items.map((item: string) => (
        <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={!!state[item]} onChange={() => onToggle(item)} className="rounded" />
          <span className={state[item] ? "line-through text-muted-foreground" : ""}>{item}</span>
        </label>
      ))}
    </div>
  );
}
