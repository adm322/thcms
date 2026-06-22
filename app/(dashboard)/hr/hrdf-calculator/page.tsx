"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, Info, MapPin, UtensilsCrossed, Home, Car, Monitor, Users, GraduationCap, Receipt } from "lucide-react";

interface HRDFResult {
  breakdown: Record<string, { amount: number; note: string }>;
  totalClaimable: number;
  costPerPax: number;
  perDay: number;
  participants: number;
  durationDays: number;
}

export default function HRDFCalculator() {
  const [participants, setParticipants] = useState(10);
  const [days, setDays] = useState(1);
  const [hours, setHours] = useState(8);
  const [trainerType, setTrainerType] = useState("external");
  const [venueType, setVenueType] = useState("externalBasic");
  const [distance, setDistance] = useState(30);
  const [distanceText, setDistanceText] = useState("30");
  const [hasAccommodation, setHasAccommodation] = useState(false);
  const [accommodationType, setAccommodationType] = useState("local");
  const [nights, setNights] = useState(1);
  const [hasEquipment, setHasEquipment] = useState(false);
  const [equipmentDays, setEquipmentDays] = useState(1);
  const [result, setResult] = useState<HRDFResult | null>(null);
  const [loading, setLoading] = useState(false);

  function calculate() {
    setLoading(true);
    const params = new URLSearchParams({
      action: "calculate",
      participants: String(participants),
      days: String(days),
      hours: String(hours),
      trainer: trainerType,
      venue: venueType,
      distance: String(distance),
      accommodation: String(hasAccommodation),
      accommodationType,
      nights: String(nights),
      equipment: String(hasEquipment),
      equipmentDays: String(equipmentDays),
    });
    fetch(`/api/hr/hrdf?${params}`)
      .then((r) => r.json())
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { calculate(); }, []);

  const isHalfDay = hours < 6;
  const mealLabel = isHalfDay ? "Half Day" : "Full Day";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">HRDF Claimable Cost Calculator</h1>
        <p className="text-muted-foreground mt-1">Estimate training expenses claimable from HRD Corp based on the Allowable Cost Matrix (ACM)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calculator className="h-4 w-4" />Training Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Participants & Duration */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1"><Users className="h-3 w-3" />Participants</label>
                <Input type="number" value={participants} onChange={(e) => setParticipants(Math.max(1, Number(e.target.value)))} min={1} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Days</label>
                <Input type="number" value={days} onChange={(e) => setDays(Math.max(0.5, Number(e.target.value)))} min={0.5} step={0.5} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Hours</label>
                <Input type="number" value={hours} onChange={(e) => setHours(Math.max(1, Number(e.target.value)))} min={1} className="h-8 text-sm" />
              </div>
            </div>

            {/* Trainer Type */}
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1"><GraduationCap className="h-3 w-3" />Trainer Type</label>
              <div className="flex gap-1">
                {[
                  { key: "internal", label: "Internal (RM120/h)" },
                  { key: "external", label: "External (RM350/h)" },
                  { key: "consultant", label: "Consultant (RM500/h)" },
                ].map((t) => (
                  <button key={t.key} onClick={() => setTrainerType(t.key)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${trainerType === t.key ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Venue */}
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1"><Home className="h-3 w-3" />Venue Type</label>
              <div className="flex gap-1">
                {[
                  { key: "ownPremises", label: "Own Premises" },
                  { key: "externalBasic", label: "Training Room (RM800/d)" },
                  { key: "hotel", label: "Hotel (RM2,000/d)" },
                ].map((v) => (
                  <button key={v.key} onClick={() => setVenueType(v.key)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${venueType === v.key ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"}`}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1"><MapPin className="h-3 w-3" />Distance from Office to Venue</label>
              <div className="flex items-center gap-2">
                <Input type="range" value={distance} onChange={(e) => { setDistance(Number(e.target.value)); setDistanceText(e.target.value); }} min={0} max={150} className="flex-1 h-6" />
                <Input value={distanceText} onChange={(e) => { setDistanceText(e.target.value); const v = parseInt(e.target.value); if (!isNaN(v)) setDistance(Math.min(150, Math.max(0, v))); }} className="w-16 h-8 text-sm text-center" />
                <span className="text-xs text-muted-foreground w-8">km</span>
              </div>
              <p className="text-[10px] text-muted-foreground">First 20km free • Max 100km/day claimable • RM 0.70/km</p>
            </div>

            {/* Accommodation Toggle */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input type="checkbox" checked={hasAccommodation} onChange={(e) => setHasAccommodation(e.target.checked)} className="rounded" />
                <Home className="h-3 w-3" /> Accommodation Required (Outstation)
              </label>
              {hasAccommodation && (
                <div className="flex gap-2 pl-5">
                  <select value={accommodationType} onChange={(e) => setAccommodationType(e.target.value)} className="h-8 rounded-md border bg-background px-2 text-xs">
                    <option value="local">Local (RM150/night)</option>
                    <option value="outstation">Outstation (RM250/night)</option>
                  </select>
                  <Input type="number" value={nights} onChange={(e) => setNights(Math.max(1, Number(e.target.value)))} className="w-16 h-8 text-sm" placeholder="Nights" />
                  <span className="text-xs text-muted-foreground self-center">nights</span>
                </div>
              )}
            </div>

            {/* Equipment Toggle */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input type="checkbox" checked={hasEquipment} onChange={(e) => setHasEquipment(e.target.checked)} className="rounded" />
                <Monitor className="h-3 w-3" /> Equipment Rental (Projector, Sound System, etc.)
              </label>
              {hasEquipment && (
                <div className="flex gap-2 pl-5">
                  <Input type="number" value={equipmentDays} onChange={(e) => setEquipmentDays(Math.max(1, Number(e.target.value)))} className="w-16 h-8 text-sm" placeholder="Days" />
                  <span className="text-xs text-muted-foreground self-center">days (max RM 500/day, RM 2,000 total)</span>
                </div>
              )}
            </div>

            <Button onClick={calculate} disabled={loading} className="w-full">
              {loading ? "Calculating..." : "Calculate Claimable Costs"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {loading ? (
            <Card><CardContent className="py-8 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</CardContent></Card>
          ) : result ? (
            <>
              {/* Summary Card */}
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="py-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Claimable</span>
                    <span className="text-3xl font-bold text-primary">RM {result.totalClaimable.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Per Participant</span>
                    <span className="font-semibold">RM {result.costPerPax.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Per Day</span>
                    <span className="font-semibold">RM {result.perDay.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{result.participants} pax × {result.durationDays} days</span>
                    <span>{mealLabel}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" />Cost Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(result.breakdown).map(([key, val]) => (
                    <div key={key} className="flex items-start justify-between text-sm py-1.5 border-b last:border-0">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-medium capitalize text-xs">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                        <p className="text-[10px] text-muted-foreground">{val.note}</p>
                      </div>
                      <span className="font-semibold flex-shrink-0">RM {val.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between text-sm font-bold pt-1">
                    <span>Total Claimable</span>
                    <span>RM {result.totalClaimable.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>

      {/* Rules Reference */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4" />HRDF Claimable Rules Reference</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <RuleCard icon={GraduationCap} title="Trainer Fees" items={["Internal: Max RM 120/hr", "External: Max RM 350/hr", "Consultant: Max RM 500/hr"]} />
            <RuleCard icon={UtensilsCrossed} title="Meals & Refreshments" items={["Full day: RM 45/pax", "Half day: RM 25/pax", "Must comply with guidelines"]} />
            <RuleCard icon={Car} title="Distance Allowance" items={["Car: RM 0.70/km", "Motorcycle: RM 0.50/km", "First 20km free", "Max 100km/day"]} />
            <RuleCard icon={Home} title="Venue & Accommodation" items={["Own premises: No claim", "Training room: RM 800/day", "Hotel venue: RM 2,000/day", "Local stay: RM 150/night", "Outstation: RM 250/night"]} />
            <RuleCard icon={Users} title="Materials & Consumables" items={["Materials: RM 50/pax/day", "Max materials: RM 5,000", "Stationery: RM 15/pax/day", "Sundries: RM 10/pax/day"]} />
            <RuleCard icon={Monitor} title="Equipment & Other" items={["Equipment: RM 500/day max", "Max RM 2,000 total", "Must submit receipts"]} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RuleCard({ icon: Icon, title, items }: { icon: any; title: string; items: string[] }) {
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-semibold">{title}</p>
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item} className="text-[10px] text-muted-foreground flex items-start gap-1">
            <span className="text-primary mt-0.5">•</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
