"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Clock, Users, MapPin, BookOpen, Calendar, DollarSign, Loader2, Download, FileText } from "lucide-react";

export default function MarketplaceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [participantCount, setParticipantCount] = useState(5);
  const [programDate, setProgramDate] = useState("");
  const [venuePref, setVenuePref] = useState("as_program");
  const [venueAddr, setVenueAddr] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/hr/programs/${id}`)
      .then((r) => r.json())
      .then(setProgram)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleBook() {
    if (!programDate) {
      setError("Please select a program date.");
      return;
    }

    const isHybrid = program?.locationType === "hybrid" || venuePref === "hybrid";
    const isOnline = venuePref === "online" || (venuePref === "as_program" && program?.locationType === "online");

    if (isHybrid || isOnline) {
      if (!meetingLink || (!meetingLink.includes("zoom.us") && !meetingLink.includes("meet.google.com"))) {
        setError("A valid Zoom or Google Meet link is required for online or hybrid sessions.");
        return;
      }
    }

    setBooking(true);
    setError("");

    try {
      const res = await fetch("/api/hr/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: id,
          participantCount,
          programDate,
          venuePreference: venuePref,
          venueAddress: venuePref === "online" ? null : (venueAddr || null),
          meetingLink: (isHybrid || isOnline) ? meetingLink : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/hr/bookings/${data.id}`);
      } else {
        const err = await res.json();
        setError(err.error || "Booking failed");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Loading...</div>;
  }

  if (!program) {
    return <div className="py-20 text-center text-muted-foreground">Program not found.</div>;
  }

  const totalFee = participantCount * program.pricePerPax;
  const depositAmount = Math.round(totalFee * 0.3);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">{program.category}</Badge>
          <Badge variant="secondary" className="capitalize">
            <MapPin className="mr-1 h-3 w-3" /> {program.locationType}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{program.title}</h1>
        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {program.trainerRating?.toFixed(1) || "N/A"} ({program.trainerName})
          </span>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {program.durationHours}h</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Max {program.maxParticipants} pax</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>About This Program</CardTitle></CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{program.description}</p>
            </CardContent>
          </Card>

          {program.itinerary && program.itinerary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Program Itinerary</span>
                  <Badge variant="outline" className="text-[10px]">
                    {(() => {
                      const f = program.itinerary[0];
                      const l = program.itinerary[program.itinerary.length - 1];
                      const [fh, fm] = f.startTime.split(":").map(Number);
                      const [lh, lm] = l.endTime.split(":").map(Number);
                      const hrs = (lh * 60 + lm - fh * 60 - fm) / 60;
                      return `${hrs.toFixed(1)}h • ${hrs <= 4 ? "Half Day" : "Full Day"}`;
                    })()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {program.itinerary.map((item: any, i: number) => {
                    const typeConfig: Record<string, { icon: string; bg: string; dot: string; border: string }> = {
                      REGISTRATION: { icon: "📋", bg: "bg-blue-50", dot: "bg-blue-400", border: "border-l-blue-400" },
                      MEAL: { icon: "🍽️", bg: "bg-amber-50", dot: "bg-amber-400", border: "border-l-amber-400" },
                      MODULE: { icon: "📖", bg: "bg-white", dot: "bg-primary", border: "border-l-primary" },
                      BREAK: { icon: "☕", bg: "bg-slate-50", dot: "bg-slate-400", border: "border-l-slate-400" },
                      CLOSING: { icon: "🏁", bg: "bg-emerald-50", dot: "bg-emerald-400", border: "border-l-emerald-400" },
                    };
                    const cfg = typeConfig[item.type] || typeConfig.MODULE;
                    return (
                      <div key={i} className={`flex items-center gap-4 rounded-lg border-l-4 ${cfg.border} ${cfg.bg} p-3`}>
                        <div className={`flex-shrink-0 w-7 h-7 rounded-full ${cfg.dot} flex items-center justify-center text-white text-xs font-bold`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm">{cfg.icon}</span>
                            <p className="text-sm font-medium truncate">{item.title}</p>
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums whitespace-nowrap">
                            {item.startTime} – {item.endTime}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {program.proposalUrl && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Training Proposal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {program.proposalLabel || "Download the official training proposal with full syllabus, pricing breakdown, and terms."}
                </p>
                <a href={program.proposalUrl} target="_blank" rel="noopener noreferrer" download>
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    <Download className="mr-2 h-4 w-4" />
                    Download Proposal
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}

          {program.syllabus && program.syllabus.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Syllabus</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1">
                  {program.syllabus.map((item: string, i: number) => (
                    <li key={i} className="text-sm">{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {program.modules && program.modules.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Modules ({program.modules.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {program.modules.map((mod: any, idx: number) => (
                  <div key={mod.id} className="flex items-center gap-3 rounded-lg bg-accent/30 px-4 py-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium">{mod.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{mod.durationMins} min</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking sidebar */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Book This Program</span>
                <span className="text-2xl font-bold text-primary">RM {program.pricePerPax}</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">per participant</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
              )}

              {program.trainerId && (
                <TrainerAvailabilityStrip trainerId={program.trainerId} date={programDate} />
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Program Date</label>
                <Input type="date" value={programDate} onChange={(e) => setProgramDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Participants</label>
                <Input
                  type="number"
                  value={participantCount}
                  onChange={(e) => setParticipantCount(Math.min(program.maxParticipants, Math.max(1, Number(e.target.value))))}
                  min={1}
                  max={program.maxParticipants}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Venue Preference</label>
                <div className="inline-flex rounded-lg border bg-muted p-0.5">
                  {(["as_program", "online", "onsite"] as const).map((v) => (
                    <button key={v}
                      onClick={() => setVenuePref(v)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        venuePref === v
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {v === "as_program" ? "Default" : v === "online" ? "Online" : "On-site"}
                    </button>
                  ))}
                </div>
                {(venuePref === "onsite") && (
                  <Input
                    value={venueAddr}
                    onChange={(e) => setVenueAddr(e.target.value)}
                    placeholder="Venue address or TBD..."
                    className="text-xs mt-2"
                  />
                )}
                {(venuePref === "online" || program.locationType === "hybrid" || (venuePref === "as_program" && program.locationType === "online")) && (
                  <div className="space-y-1.5 mt-2">
                    <label className="text-xs font-semibold text-muted-foreground">Virtual Meeting Link (Zoom / Google Meet)</label>
                    <Input
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-accent/50 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Price per pax</span>
                  <span>RM {program.pricePerPax}</span>
                </div>
                <div className="flex justify-between">
                  <span>Participants</span>
                  <span>× {participantCount}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total Fee</span>
                  <span>RM {totalFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Deposit (30%)</span>
                  <span>RM {depositAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* HRDF Claimable Estimate */}
              {programDate && (
                <HRDFEstimate participants={participantCount} durationHours={program.durationHours} venueType={program.locationType} />
              )}

              <Button className="w-full" onClick={handleBook} disabled={booking || !programDate}>
                {booking ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking...</>
                ) : (
                  <><Calendar className="mr-2 h-4 w-4" /> Book Program</>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                30% deposit required to confirm booking
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TrainerAvailabilityStrip({ trainerId, date }: { trainerId: string; date: string }) {
  const [status, setStatus] = useState<"available" | "booked" | "unavailable" | null>(null);

  useEffect(() => {
    if (!date) return;
    const d = new Date(date);
    fetch(`/api/hr/trainers/availability?trainerId=${trainerId}&month=${d.getMonth()}&year=${d.getFullYear()}`)
      .then((r) => r.json())
      .then((data) => {
        const day = (data.days || []).find((d: any) => d.date === date);
        if (day) setStatus(day.status);
      })
      .catch(console.error);
  }, [trainerId, date]);

  if (!date) return null;
  if (!status) {
    return (
      <div className="rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground text-center">
        Select a date to check trainer availability
      </div>
    );
  }

  const config: Record<string, { bg: string; text: string; label: string }> = {
    available: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "✓ Trainer is available on this date" },
    booked: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "⚠ Trainer has a booking on this date" },
    unavailable: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "✗ Trainer is unavailable on this date" },
  };
  const cfg = config[status];

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </div>
  );
}

function HRDFEstimate({ participants, durationHours, venueType }: { participants: number; durationHours: number; venueType: string }) {
  const [estimate, setEstimate] = useState<{ claimable: number; breakdown: Record<string, any> } | null>(null);

  useEffect(() => {
    const venue = venueType === "onsite" ? "externalBasic" : "ownPremises";
    const params = new URLSearchParams({
      action: "calculate", participants: String(participants),
      days: String(Math.ceil(durationHours / 8)),
      hours: String(durationHours), trainer: "external", venue,
      distance: "0", accommodation: "false", accommodationType: "local",
      nights: "0", equipment: "false", equipmentDays: "0",
    });
    fetch(`/api/hr/hrdf?${params}`)
      .then(r => r.json())
      .then(data => setEstimate({ claimable: data.totalClaimable, breakdown: data.breakdown }))
      .catch(console.error);
  }, [participants, durationHours, venueType]);

  if (!estimate) return null;

  return (
    <div className="rounded-lg bg-emerald-50/50 border border-emerald-200 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-emerald-800">🏛️ HRDF Claimable Estimate</span>
        <span className="text-sm font-bold text-emerald-700">RM {estimate.claimable.toLocaleString()}</span>
      </div>
      <p className="text-[10px] text-emerald-600/70">
        Up to RM {estimate.claimable.toLocaleString()} may be claimed back from HRD Corp. Final claimable amount subject to HRDF approval and receipts.
      </p>
    </div>
  );
}
