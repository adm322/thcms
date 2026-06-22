"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Check, GraduationCap } from "lucide-react";

const CATEGORIES = ["Leadership", "Technical", "Soft Skills", "Compliance", "Team Building", "HR Operations", "Other"];
const LOCATION_TYPES = [
  { value: "onsite", label: "On-Site" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

const STEPS = ["Program Info", "Modules", "Pricing"];

export default function NewProgramPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Leadership");
  const [locationType, setLocationType] = useState("onsite");
  const [durationHours, setDurationHours] = useState(4);
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [pricePerPax, setPricePerPax] = useState(500);
  const [syllabusItems, setSyllabusItems] = useState<string[]>([""]);
  const [modules, setModules] = useState([{ title: "", durationMins: 60 }]);

  async function handleSave(status: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/trainer/programs/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          locationType,
          durationHours,
          maxParticipants,
          pricePerPax,
          syllabus: syllabusItems.filter(Boolean),
          status,
          modules: modules.filter((m) => m.title.trim()).map((m, i) => ({
            title: m.title,
            description: "",
            orderIndex: i,
            durationMins: m.durationMins,
          })),
        }),
      });

      if (res.ok) {
        const program = await res.json();
        router.push(`/trainer/programs/${program.id}`);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                  ? "bg-primary/20 text-primary ring-2 ring-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm ${i === step ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      <Card>
        {/* Step 0: Program Info */}
        {step === 0 && (
          <>
            <CardHeader>
              <CardTitle>Program Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Program Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Transformational Leadership" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the program..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          category === cat ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (hours)</label>
                  <Input type="number" value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} min={1} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Participants</label>
                  <Input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(Number(e.target.value))} min={1} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <div className="flex gap-1">
                    {LOCATION_TYPES.map((lt) => (
                      <button
                        key={lt.value}
                        onClick={() => setLocationType(lt.value)}
                        className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium ${
                          locationType === lt.value ? "bg-primary text-primary-foreground" : "bg-accent"
                        }`}
                      >
                        {lt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Syllabus / Topics</label>
                {syllabusItems.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const next = [...syllabusItems];
                        next[i] = e.target.value;
                        if (i === next.length - 1 && e.target.value) next.push("");
                        setSyllabusItems(next);
                      }}
                      placeholder={`Topic ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </>
        )}

        {/* Step 1: Modules */}
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Program Modules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {modules.map((mod, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={mod.title}
                      onChange={(e) => {
                        const next = [...modules];
                        next[i] = { ...next[i], title: e.target.value };
                        setModules(next);
                      }}
                      placeholder="Module title"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={mod.durationMins}
                        onChange={(e) => {
                          const next = [...modules];
                          next[i] = { ...next[i], durationMins: Number(e.target.value) };
                          setModules(next);
                        }}
                        className="w-24"
                        placeholder="Mins"
                      />
                      <span className="text-sm text-muted-foreground">minutes</span>
                    </div>
                  </div>
                  {modules.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModules(modules.filter((_, idx) => idx !== i))}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setModules([...modules, { title: "", durationMins: 60 }])}
                className="w-full"
              >
                + Add Module
              </Button>
            </CardContent>
          </>
        )}

        {/* Step 2: Pricing */}
        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Pricing & Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Per Pax (RM)</label>
                  <Input type="number" value={pricePerPax} onChange={(e) => setPricePerPax(Number(e.target.value))} min={0} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estimated Total (RM)</label>
                  <div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 text-lg font-bold">
                    {pricePerPax * maxParticipants > 0 ? `RM ${(pricePerPax * maxParticipants).toLocaleString()}` : "—"}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg border bg-accent/30 p-4 space-y-2">
                <h4 className="font-semibold">Program Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Title:</span>
                  <span>{title || "(not set)"}</span>
                  <span className="text-muted-foreground">Category:</span>
                  <Badge variant="outline">{category}</Badge>
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{durationHours} hours</span>
                  <span className="text-muted-foreground">Location:</span>
                  <span className="capitalize">{locationType}</span>
                  <span className="text-muted-foreground">Modules:</span>
                  <span>{modules.filter((m) => m.title.trim()).length}</span>
                  <span className="text-muted-foreground">Capacity:</span>
                  <span>{maxParticipants} pax</span>
                  <span className="text-muted-foreground">Price:</span>
                  <span>RM {pricePerPax}/pax</span>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Navigation */}
        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSave("DRAFT")} disabled={saving}>
                  Save Draft
                </Button>
                <Button onClick={() => handleSave("PUBLISHED")} disabled={saving || !title.trim()}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  {saving ? "Publishing..." : "Publish Program"}
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
