"use client";

import { useState, useEffect, use } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/admin/bookings/${id}`)
      .then((r) => r.json())
      .then(setBooking)
      .catch(console.error);
  }, [id]);

  if (!booking) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Booking Detail</h1>
        <Badge variant={booking.status === "COMPLETED" ? "outline" : "default"}>{booking.status}</Badge>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Program Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Program:</strong> {booking.programTitle}</p>
            <p><strong>Trainer:</strong> {booking.trainerName}</p>
            <p><strong>Company:</strong> {booking.companyName}</p>
            <p><strong>Date:</strong> {new Date(booking.date).toLocaleDateString("en-MY")}</p>
            <p><strong>Total Fee:</strong> RM {booking.totalFee.toLocaleString()}</p>
            <p><strong>Deposit:</strong> {booking.depositStatus} (RM {booking.depositPaid.toLocaleString()})</p>
            {booking.status === "CONFIRMED" && (
              <div className="pt-2 border-t mt-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">🏛️ HRDF Claim Tracking</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>🏢 Employer: <Badge variant={booking.employerHrdfSubmitted ? "default" : "secondary"}>{booking.employerHrdfSubmitted ? "Submitted" : "Pending"}</Badge></div>
                  <div>👨‍🏫 Trainer: <Badge variant={booking.trainerHrdfSubmitted ? "default" : "secondary"}>{booking.trainerHrdfSubmitted ? "Submitted" : "Pending"}</Badge></div>
                </div>
                {booking.trainerDocumentsUrl && (
                  <a href={booking.trainerDocumentsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline">
                    📎 View Submitted Documents
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Training Checklist */}
        {booking.status !== "CANCELLED" && (
          <TrainingChecklist bookingId={booking.id} status={booking.status} date={booking.date} />
        )}

        <Card>
          <CardHeader><CardTitle>Participants ({booking.participants?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            {booking.participants?.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1 text-sm">
                <span>{p.name}</span>
                <Badge variant="outline">{p.attendanceStatus}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TrainingChecklist({ bookingId, status, date }: { bookingId: string; status: string; date: string }) {
  const [items, setItems] = useState<Record<string, boolean>>({});
  const checklistKey = `training-checklist-${bookingId}`;

  useEffect(() => {
    const saved = localStorage.getItem(checklistKey);
    if (saved) setItems(JSON.parse(saved));
  }, [checklistKey]);

  function toggle(item: string) {
    const next = { ...items, [item]: !items[item] };
    setItems(next);
    localStorage.setItem(checklistKey, JSON.stringify(next));
  }

  const isPast = new Date(date) < new Date();
  const isConfirmed = status === "CONFIRMED";

  const preItems = [
    "Training proposal & quotation received",
    "HRDF grant application submitted via e-TRiS",
    "Venue & catering confirmed",
    "Training materials printed",
    "Joining instructions sent to participants",
  ];
  const duringItems = [
    "Attendance sheet (T3) signed daily",
    "Photos/videos taken during training",
    "Pre-test / post-test administered",
    "Evaluation forms distributed & collected",
    "Certificates of completion issued",
  ];
  const postItems = [
    "Training completion report compiled",
    "Claim form submitted to HRDF via e-TRiS",
    "Invoice & receipts uploaded",
    "Attendance records uploaded",
    "Trainer profile & certificates uploaded",
  ];

  const preDone = preItems.filter(i => items[i]).length;
  const duringDone = duringItems.filter(i => items[i]).length;
  const postDone = postItems.filter(i => items[i]).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">📋 Training Checklist</span>
          <span className="text-xs text-muted-foreground">
            {preDone + duringDone + postDone}/{preItems.length + duringItems.length + postItems.length} done
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChecklistGroup title="Pre-Training" items={preItems} state={items} onToggle={toggle} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/30" />
        {isPast && (
          <ChecklistGroup title="During Training" items={duringItems} state={items} onToggle={toggle} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-950/30" />
        )}
        {isPast && (
          <ChecklistGroup title="Post-Training (HRDF Claim)" items={postItems} state={items} onToggle={toggle} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        )}
        {!isPast && (
          <p className="text-xs text-muted-foreground italic">During & post-training checklists unlock after the training date</p>
        )}
      </CardContent>
    </Card>
  );
}

function ChecklistGroup({ title, items, state, onToggle, color, bg }: any) {
  const done = items.filter((i: string) => state[i]).length;
  return (
    <div className={`rounded-lg ${bg} p-3 space-y-1.5`}>
      <div className="flex items-center justify-between mb-1">
        <p className={`text-xs font-semibold ${color}`}>{title}</p>
        <span className="text-[10px] text-muted-foreground">{done}/{items.length}</span>
      </div>
      {items.map((item: string) => (
        <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={!!state[item]} onChange={() => onToggle(item)} className="rounded" />
          <span className={state[item] ? "line-through text-muted-foreground" : ""}>{item}</span>
        </label>
      ))}
    </div>
  );
}
