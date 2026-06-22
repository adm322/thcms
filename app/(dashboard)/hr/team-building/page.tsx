"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/Toast";
import {
  MapPin, Users, Calendar, ChevronRight, ChevronLeft, Check, Building2,
  Sparkles, Star, AlertTriangle, TrendingUp, DollarSign, Home, Car, UtensilsCrossed, GraduationCap, HelpCircle,
} from "lucide-react";
import { WorkflowGuideModal } from "@/components/WorkflowGuideModal";

const STEPS = ["Team Profile", "Choose Activity", "Select Venue", "Review & Book"];

// KL-area HQ locations for distance calculation
const HQ_LOCATIONS = [
  { name: "KLCC / KL City Centre", lat: 3.1535, lng: 101.7135 },
  { name: "Bangsar South", lat: 3.1100, lng: 101.6700 },
  { name: "Damansara Heights", lat: 3.1400, lng: 101.6500 },
  { name: "Mid Valley / KL Sentral", lat: 3.1175, lng: 101.6775 },
  { name: "Petaling Jaya", lat: 3.1000, lng: 101.6400 },
  { name: "Subang Jaya", lat: 3.0500, lng: 101.5900 },
  { name: "Shah Alam", lat: 3.0738, lng: 101.5183 },
  { name: "Cyberjaya", lat: 2.9188, lng: 101.6530 },
  { name: "Putrajaya", lat: 2.9300, lng: 101.6900 },
  { name: "Puchong", lat: 3.0300, lng: 101.6200 },
  { name: "Cheras / Balakong", lat: 3.0500, lng: 101.7700 },
  { name: "Mont Kiara / Sri Hartamas", lat: 3.1700, lng: 101.6500 },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export default function TeamBuildingPlanner() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [activities, setActivities] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);

  // Form state
  const [hqLocation, setHqLocation] = useState(HQ_LOCATIONS[0]);
  const [employeeCount, setEmployeeCount] = useState(25);
  const [avgAge, setAvgAge] = useState(32);
  const [ageMin, setAgeMin] = useState(22);
  const [ageMax, setAgeMax] = useState(55);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [needsAccommodation, setNeedsAccommodation] = useState(false);
  const [programDays, setProgramDays] = useState(1);
  const [costResult, setCostResult] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [isConsecutive, setIsConsecutive] = useState(false);
  const [batchCount, setBatchCount] = useState(2);

  useEffect(() => {
    fetch("/api/hr/team-building")
      .then(r => r.json())
      .then(d => { setActivities(d.activities || []); setVenues(d.venues || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
    fetch("/api/hr/team-building?list=true")
      .then(r => r.json()).then(setSubmissions).catch(() => {});
  }, []);

  async function analyzeActivity(activity: any) {
    setSelectedActivity(activity);
    setAnalyzing(true);
    // Generate simulated employee ages based on inputs
    const ages: number[] = [];
    for (let i = 0; i < employeeCount; i++) {
      ages.push(ageMin + Math.floor(Math.random() * (ageMax - ageMin + 1)));
    }
    const empData = ages.map(a => ({ age: a }));
    const res = await fetch("/api/hr/team-building", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "analyze", activityId: activity.id, employees: empData }),
    });
    if (res.ok) setAnalysis(await res.json());
    setAnalyzing(false);
  }

  async function calculateCosts() {
    if (!selectedActivity || !selectedVenue) return;
    setCalculating(true);
    const res = await fetch("/api/hr/team-building", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "calculate", activityId: selectedActivity.id, venueId: selectedVenue.id,
        participants: employeeCount, accommodation: needsAccommodation, days: programDays,
      }),
    });
    if (res.ok) setCostResult(await res.json());
    setCalculating(false);
    setStep(3);
  }

  const distanceKm = selectedVenue ? haversineKm(hqLocation.lat, hqLocation.lng, selectedVenue.lat, selectedVenue.lng) : 0;

  async function handleSubmitRequest() {
    if (!costResult || !startDate) return;
    setSubmitting(true);
    const res = await fetch("/api/hr/team-building", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit",
        eventName: selectedActivity?.name || "Team Building Event",
        hqLocation: hqLocation.name,
        teamSize: employeeCount, avgAge, ageMin, ageMax,
        activityId: selectedActivity.id, activityName: selectedActivity.name, activityCategory: selectedActivity.category,
        venueId: selectedVenue.id, venueName: selectedVenue.name, venueAddress: selectedVenue.address,
        startDate, isConsecutive, batchCount,
        activityCost: costResult.costs.activityCost,
        accommodationCost: costResult.costs.accommodationCost,
        totalCost: costResult.costs.totalCost,
        hrdfClaimable: costResult.hrdf.totalClaimable + Math.round(distanceKm * 0.70),
      }),
    });
    if (res.ok) {
      toast("Request submitted! Admin will review and send you a proposal.", "success");
      const updated = await fetch("/api/hr/team-building?list=true").then(r => r.json());
      setSubmissions(updated);
    } else {
      toast("Failed to submit. Please try again.", "error");
    }
    setSubmitting(false);
  }
  const ageRangeStr = `${ageMin}-${ageMax}`;

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-64"/><Skeleton className="h-64 w-full rounded-xl"/></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Building Planner</h1>
        <p className="text-muted-foreground mt-1">Plan team building with activity suitability analysis, venue selection & HRDF calculator</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary/20 text-primary ring-2 ring-primary" : "bg-muted text-muted-foreground"
            }`}>{i < step ? <Check className="h-4 w-4"/> : i + 1}</div>
            <span className={`text-sm ${i <= step ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
            {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground"/>}
          </div>
        ))}
      </div>

      {/* STEP 1: Team Profile */}
      {step === 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5"/>Team Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1"><MapPin className="h-3.5 w-3.5"/>Company HQ Location</label>
              <select value={hqLocation.name} onChange={(e) => setHqLocation(HQ_LOCATIONS.find(h => h.name === e.target.value) || HQ_LOCATIONS[0])}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                {HQ_LOCATIONS.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
              </select>
              <p className="text-[10px] text-muted-foreground">Used to calculate distance to venue for HRDF mileage claims</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><label className="text-xs font-medium"><Users className="h-3 w-3 inline mr-1"/>Team Size</label><Input type="number" value={employeeCount} onChange={e => setEmployeeCount(Math.max(1, Number(e.target.value)))} className="h-9 text-sm"/></div>
              <div className="space-y-1"><label className="text-xs font-medium">Avg Age</label><Input type="number" value={avgAge} onChange={e => setAvgAge(Number(e.target.value))} className="h-9 text-sm"/></div>
              <div className="space-y-1"><label className="text-xs font-medium">Age Range</label><div className="flex gap-1 items-center"><Input type="number" value={ageMin} onChange={e => setAgeMin(Number(e.target.value))} className="h-9 text-sm w-16"/> <span className="text-xs">–</span> <Input type="number" value={ageMax} onChange={e => setAgeMax(Number(e.target.value))} className="h-9 text-sm w-16"/></div></div>
            </div>

            {/* Date Selection */}
            <Separator />
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-1"><Calendar className="h-3.5 w-3.5"/>Program Schedule</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Start Date</label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-sm"/>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Program Type</label>
                  <div className="flex gap-1">
                    <button onClick={() => setIsConsecutive(false)}
                      className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${!isConsecutive ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"}`}>
                      Single Day
                    </button>
                    <button onClick={() => setIsConsecutive(true)}
                      className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${isConsecutive ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"}`}>
                      Consecutive Batch
                    </button>
                  </div>
                </div>
              </div>

              {isConsecutive && startDate && (
                <div className="rounded-lg border bg-accent/30 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium">Number of batches:</label>
                    <Input type="number" value={batchCount} onChange={e => setBatchCount(Math.max(2, Math.min(10, Number(e.target.value))))} className="w-16 h-8 text-sm" min={2} max={10}/>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      const dates: Date[] = [];
                      const start = new Date(startDate + "T00:00:00");
                      for (let i = 0; i < batchCount; i++) {
                        const d = new Date(start);
                        d.setDate(d.getDate() + i);
                        dates.push(d);
                      }
                      return dates.map((d, i) => (
                        <Badge key={i} variant={i === 0 ? "default" : "secondary"} className="text-[10px]">
                          {i === 0 ? "Start" : `Day ${i+1}`}: {d.toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" })}
                        </Badge>
                      ));
                    })()}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {batchCount} consecutive days • {startDate ? new Date(startDate).toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
                    {startDate && isConsecutive ? ` – ${(() => { const d = new Date(startDate); d.setDate(d.getDate() + batchCount - 1); return d.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); })()}` : ""}
                  </p>
                </div>
              )}
            </div>

            <Button onClick={() => setStep(1)} className="w-full">Next: Choose Activity <ChevronRight className="ml-1 h-4 w-4"/></Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Activity Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5"/>Choose Activity</CardTitle>
              <div className="flex gap-1">
                {["All","Adventure","Indoor","Creative","Social","Problem Solving"].map(c => (
                  <button key={c} onClick={() => setCategoryFilter(c)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${categoryFilter === c ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"}`}>{c}</button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.filter(a => categoryFilter === "All" || a.category === categoryFilter).map(a => (
                <div key={a.id} onClick={() => analyzeActivity(a)}
                  className={`flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-all ${
                    selectedActivity?.id === a.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/30 hover:shadow-sm"
                  }`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl flex-shrink-0">{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{a.name}</p>
                      <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{a.durationHours}h</Badge>
                      <Badge variant="secondary" className="text-[10px]">RM {a.pricePerPax}/pax</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                      <span>👥 {a.minPax}-{a.maxPax} pax</span>
                      <span>•</span>
                      <span>🎯 Ages {a.recommendedAges}</span>
                      <span>•</span>
                      <span>⚡ Difficulty: {"🟢🟡🟠🔴⚫".slice(0, a.difficulty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Analysis Panel */}
          {analyzing && <Card><CardContent className="py-8"><Skeleton className="h-4 w-48"/><Skeleton className="h-4 w-64 mt-2"/></CardContent></Card>}
          {analysis && selectedActivity && (
            <Card className={analysis.teamAnalysis.suitabilityScore >= 65 ? "border-emerald-200 bg-emerald-50/30" : "border-amber-200 bg-amber-50/30"}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    {analysis.teamAnalysis.suitabilityScore >= 65 ? <Check className="h-4 w-4 text-emerald-500"/> : <AlertTriangle className="h-4 w-4 text-amber-500"/>}
                    Team Suitability: {analysis.teamAnalysis.rating}
                  </h4>
                  <Badge variant={analysis.teamAnalysis.suitabilityScore >= 65 ? "default" : "secondary"} className="text-xs">
                    {analysis.teamAnalysis.suitabilityScore}% match
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Avg Age:</span> <span className="font-medium">{analysis.teamAnalysis.avgAge}</span></div>
                  <div><span className="text-muted-foreground">Age Range:</span> <span className="font-medium">{analysis.teamAnalysis.ageRange}</span></div>
                  <div><span className="text-muted-foreground">Can Join:</span> <span className="font-medium">{analysis.teamAnalysis.percentCanJoin}%</span></div>
                </div>
                {analysis.teamAnalysis.riskFactors.length > 0 && (
                  <div className="space-y-1">
                    {analysis.teamAnalysis.riskFactors.map((r: string, i: number) => (
                      <p key={i} className="text-[11px] text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/>{r}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(0)}><ChevronLeft className="mr-1 h-4 w-4"/>Back</Button>
            <Button onClick={() => setStep(2)} disabled={!selectedActivity} className="flex-1">Next: Select Venue <ChevronRight className="ml-1 h-4 w-4"/></Button>
          </div>
        </div>
      )}

      {/* STEP 3: Venue Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/>Select Venue</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {venues.map((v: any) => {
                const dist = haversineKm(hqLocation.lat, hqLocation.lng, v.lat, v.lng);
                return (
                  <div key={v.id} onClick={() => setSelectedVenue(v)}
                    className={`flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-all ${
                      selectedVenue?.id === v.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/30 hover:shadow-sm"
                    }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{v.name}</p>
                        <Badge variant="outline" className="text-[10px] capitalize">{v.type.replace("_", " ")}</Badge>
                        {v.hasAccommodation && <Badge className="text-[10px] bg-blue-100 text-blue-700">🏨 Stay: RM{v.accommodationRate}/night</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{v.address}, {v.state}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Car className="h-3 w-3"/>{dist}km from HQ</span>
                        <span>•</span>
                        <span>👥 Max {v.maxCapacity} pax</span>
                        <span>•</span>
                        <span>{v.features.slice(0, 2).join(", ")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Map Preview */}
          {selectedVenue && (
            <Card>
              <CardContent className="p-0 overflow-hidden rounded-xl">
                <div className="relative h-48 bg-muted">
                  <iframe
                    width="100%" height="100%" style={{border:0}}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAqv8wq123&q=${encodeURIComponent(selectedVenue.address)},${selectedVenue.state},Malaysia&zoom=13`}>
                  </iframe>
                  {/* Fallback: show static info since we don't have a real API key */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 p-4 text-center">
                    <MapPin className="h-8 w-8 text-primary mb-2"/>
                    <p className="text-sm font-semibold">{selectedVenue.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedVenue.address}, {selectedVenue.state}</p>
                    <p className="text-xs font-medium text-primary mt-1">{distanceKm}km from HQ ({hqLocation.name})</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Options */}
          {selectedVenue && selectedVenue.hasAccommodation && (
            <Card>
              <CardContent className="py-3 space-y-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={needsAccommodation} onChange={e => setNeedsAccommodation(e.target.checked)} className="rounded"/>
                  <Home className="h-4 w-4"/> Include overnight accommodation (RM {selectedVenue.accommodationRate}/pax/night)
                </label>
                {needsAccommodation && (
                  <div className="flex items-center gap-2 pl-6">
                    <label className="text-xs">Nights:</label>
                    <Input type="number" value={programDays} onChange={e => setProgramDays(Math.max(1, Number(e.target.value)))} className="w-16 h-8 text-sm"/>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="mr-1 h-4 w-4"/>Back</Button>
            <Button onClick={calculateCosts} disabled={!selectedVenue || calculating} className="flex-1">
              {calculating ? "Calculating..." : "Calculate & Review"} <ChevronRight className="ml-1 h-4 w-4"/>
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Review */}
      {step === 3 && costResult && (
        <div className="space-y-4">
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="py-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total Estimated Cost</span>
                <span className="text-3xl font-bold text-primary">RM {costResult.costs.totalCost.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><span className="text-muted-foreground">Per Pax:</span> <span className="font-semibold">RM {costResult.costs.perPax}</span></div>
                <div><span className="text-muted-foreground">Team Size:</span> <span className="font-semibold">{costResult.costs.pax} pax</span></div>
                <div><span className="text-muted-foreground">Distance:</span> <span className="font-semibold">{distanceKm}km</span></div>
              </div>
              {startDate && (
                <div className="flex items-center gap-2 text-sm border-t pt-3 mt-2">
                  <Calendar className="h-4 w-4 text-muted-foreground"/>
                  <span className="text-muted-foreground">
                    {isConsecutive
                      ? `${batchCount}-day consecutive program: ${new Date(startDate).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })} – ${(() => { const d = new Date(startDate); d.setDate(d.getDate() + batchCount - 1); return d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }); })()}`
                      : `Single day: ${new Date(startDate).toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`
                    }
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4"/>Cost Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>{costResult.activity.name}</span><span>RM {costResult.costs.activityCost.toLocaleString()}</span></div>
                {costResult.costs.accommodationCost > 0 && <div className="flex justify-between"><span>Accommodation ({programDays} night{programDays>1?"s":""})</span><span>RM {costResult.costs.accommodationCost.toLocaleString()}</span></div>}
                <Separator/>
                <div className="flex justify-between font-bold"><span>Total</span><span>RM {costResult.costs.totalCost.toLocaleString()}</span></div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600"/>HRDF Claimable</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="flex items-center gap-1"><GraduationCap className="h-3 w-3"/>Trainer Fee</span><span>RM {costResult.hrdf.trainerFee.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="flex items-center gap-1"><UtensilsCrossed className="h-3 w-3"/>Meals</span><span>RM {costResult.hrdf.meals.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Materials</span><span>RM {costResult.hrdf.materials.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Venue</span><span>RM {costResult.hrdf.venue.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="flex items-center gap-1"><Car className="h-3 w-3"/>Mileage ({distanceKm}km × RM0.70)</span><span>RM {Math.round(distanceKm * 0.70).toLocaleString()}</span></div>
                <Separator/>
                <div className="flex justify-between font-bold text-emerald-700"><span>Total Claimable</span><span>RM {(costResult.hrdf.totalClaimable + Math.round(distanceKm * 0.70)).toLocaleString()}</span></div>
              </CardContent>
            </Card>
          </div>

          <Button className="w-full" size="lg" onClick={handleSubmitRequest} disabled={submitting || !startDate}>
            {submitting ? "Submitting..." : <><Check className="mr-2 h-4 w-4"/> Submit for Admin Approval</>}
          </Button>
        </div>
      )}

      {/* Submission Status Tracker — always visible */}
      {submissions.length > 0 && (
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setShowHistory(!showHistory)}>
            <CardTitle className="text-base flex items-center gap-2">
              📋 Your Submissions ({submissions.length})
            </CardTitle>
            <span className="text-xs text-muted-foreground">{showHistory ? "Hide" : "Show"}</span>
            <Button variant="ghost" size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); setShowWorkflow(true); }}>
              <HelpCircle className="h-3.5 w-3.5 mr-1"/> Process Guide
            </Button>
          </CardHeader>
          {showHistory && (
            <CardContent className="space-y-3">
              {submissions.map((sub: any) => {
                const statusConfig: Record<string, { icon: string; color: string; bg: string; label: string }> = {
                  SUBMITTED: { icon: "📨", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", label: "Submitted — Awaiting Review" },
                  REVIEWING: { icon: "🔍", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Under Review by Admin" },
                  APPROVED: { icon: "✅", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", label: "Approved — Proposal Sent" },
                  REJECTED: { icon: "❌", color: "text-red-700", bg: "bg-red-50 border-red-200", label: "Rejected" },
                  HRDF_SUBMITTED: { icon: "🏛️", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", label: "HRDF Claim Submitted" },
                  COMPLETED: { icon: "🎉", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", label: "Completed" },
                };
                const cfg = statusConfig[sub.status] || statusConfig.SUBMITTED;
                return (
                  <div key={sub.id} className={`rounded-xl border p-5 ${cfg.bg}`}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cfg.icon}</span>
                        <div>
                          <p className="font-semibold text-base">{sub.activityName}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{sub.venueName} • {new Date(sub.startDate).toLocaleDateString("en-MY")} • {sub.teamSize} pax</p>
                        </div>
                      </div>
                      <Badge className={`text-sm px-3 py-1 ${cfg.color} ${cfg.bg} border`}>{cfg.label}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                      <div><span className="text-muted-foreground">Total:</span> <span className="font-semibold">RM {sub.totalCost?.toLocaleString()}</span></div>
                      <div><span className="text-muted-foreground">HRDF:</span> <span className="font-semibold">RM {sub.hrdfClaimable?.toLocaleString()}</span></div>
                      <div><span className="text-muted-foreground">Submitted:</span> <span className="font-medium">{new Date(sub.createdAt).toLocaleDateString("en-MY")}</span></div>
                    </div>
                    {/* HRDF Submission Tracking */}
                    {sub.status === "APPROVED" && (
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t text-[10px]">
                        <div className="flex items-center gap-1">
                          <span>🏢 Employer:</span>
                          <Badge variant={sub.employerHrdfSubmitted ? "default" : "secondary"} className="text-[9px]">
                            {sub.employerHrdfSubmitted ? "Submitted" : "Pending"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>👨‍🏫 Trainer:</span>
                          <Badge variant={sub.trainerHrdfSubmitted ? "default" : "secondary"} className="text-[9px]">
                            {sub.trainerHrdfSubmitted ? "Submitted" : "Pending"}
                          </Badge>
                        </div>
                        {!sub.employerHrdfSubmitted && !sub.trainerHrdfSubmitted && (
                          <p className="col-span-2 text-muted-foreground">Both parties may need to submit to HRDF depending on scheme (SBL/SBL-Khas)</p>
                        )}
                      </div>
                    )}
                    {sub.adminNotes && <p className="mt-2 text-xs text-muted-foreground border-t pt-2">📝 Admin note: {sub.adminNotes}</p>}
                    {sub.trainerDocumentsUrl && (
                      <a href={sub.trainerDocumentsUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline bg-primary/5 rounded-lg px-3 py-1.5">
                        📎 View Attached Document
                      </a>
                    )}
                    {sub.invoiceUrl && (
                      <a href={sub.invoiceUrl} target="_blank" className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline">
                        📄 View Invoice
                      </a>
                    )}
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>
      )}

      <WorkflowGuideModal
        open={showWorkflow}
        onClose={() => setShowWorkflow(false)}
        role="HR"
        status={submissions[0]?.status || "SUBMITTED"}
        employerHrdfSubmitted={submissions[0]?.employerHrdfSubmitted || false}
        trainerHrdfSubmitted={submissions[0]?.trainerHrdfSubmitted || false}
        requestType="Team Building"
      />
    </div>
  );
}
