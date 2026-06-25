"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";

const CATEGORIES = ["Leadership", "Technical", "Soft Skills", "Compliance", "Team Building", "HR Operations", "Other"];

export default function EditProgram({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    fetch(`/api/trainer/programs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title: data.title,
          description: data.description,
          category: data.category,
          durationHours: data.durationHours,
          maxParticipants: data.maxParticipants,
          pricePerPax: data.pricePerPax,
          locationType: data.locationType,
          status: data.status,
          proposalUrl: data.proposalUrl || "",
          proposalLabel: data.proposalLabel || "",
          thumbnailUrl: data.thumbnailUrl || "",
          itinerary: data.itinerary || [],
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAiEnhance() {
    setAiEnhancing(true);
    const res = await fetch("/api/ai/enhance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, bulletPoints: form.description?.split("\n").filter(Boolean) || [] }),
    });
    if (res.ok) {
      const data = await res.json();
      setForm({ ...form, description: data.description });
    }
    setAiEnhancing(false);
  }

  async function handleSave(newStatus?: string) {
    setSaving(true);
    const res = await fetch(`/api/trainer/programs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status: newStatus || form.status }),
    });
    // Save itinerary
    if (form.itinerary?.length > 0) {
      await fetch(`/api/trainer/programs/${id}/itinerary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: form.itinerary }),
      });
    }
    if (res.ok) {
      router.push(`/trainer/programs/${id}`);
      router.refresh();
    }
    setSaving(false);
  }

  if (loading) return <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Program</h1>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Description</label>
              <button type="button" onClick={handleAiEnhance} disabled={aiEnhancing || !form.title} className="text-xs text-violet-600 hover:text-violet-800 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />{aiEnhancing ? "Enhancing..." : "AI Enhance"}
              </button>
            </div>
            <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, category: c })}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${form.category === c ? "bg-primary text-primary-foreground" : "bg-accent"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (h)</label>
              <Input type="number" value={form.durationHours || 4} onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Pax</label>
              <Input type="number" value={form.maxParticipants || 20} onChange={(e) => setForm({ ...form, maxParticipants: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price/Pax (RM)</label>
              <Input type="number" value={form.pricePerPax || 0} onChange={(e) => setForm({ ...form, pricePerPax: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Proposal URL (PDF)</label>
              <Input value={form.proposalUrl || ""} onChange={(e) => setForm({ ...form, proposalUrl: e.target.value })} placeholder="/proposals/my-training.pdf" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Proposal Label</label>
              <Input value={form.proposalLabel || ""} onChange={(e) => setForm({ ...form, proposalLabel: e.target.value })} placeholder="e.g. Full training proposal with pricing" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Thumbnail URL</label>
              <Input value={form.thumbnailUrl || ""} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="/thumbnails/custom.svg or https://..." />
            </div>
          </div>

          {/* Itinerary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Program Itinerary</label>
              <button
                type="button"
                onClick={() => {
                  const it = form.itinerary || [];
                  setForm({ ...form, itinerary: [...it, { type: "MODULE", title: "", startTime: "09:00", endTime: "10:00" }] });
                }}
                className="text-xs text-primary hover:underline"
              >
                + Add Time Slot
              </button>
            </div>
            {(form.itinerary || []).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                <select
                  value={item.type}
                  onChange={(e) => {
                    const it = [...(form.itinerary || [])];
                    it[i] = { ...it[i], type: e.target.value };
                    setForm({ ...form, itinerary: it });
                  }}
                  className="w-28 h-8 rounded-md border bg-card px-2 text-xs"
                >
                  <option value="REGISTRATION">Registration</option>
                  <option value="MEAL">Meal Break</option>
                  <option value="MODULE">Module</option>
                  <option value="BREAK">Break</option>
                  <option value="CLOSING">Closing</option>
                </select>
                <Input
                  value={item.title}
                  onChange={(e) => {
                    const it = [...(form.itinerary || [])];
                    it[i] = { ...it[i], title: e.target.value };
                    setForm({ ...form, itinerary: it });
                  }}
                  placeholder="Title"
                  className="flex-1 h-8 text-xs"
                />
                <Input
                  type="time"
                  value={item.startTime}
                  onChange={(e) => {
                    const it = [...(form.itinerary || [])];
                    it[i] = { ...it[i], startTime: e.target.value };
                    setForm({ ...form, itinerary: it });
                  }}
                  className="w-24 h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={item.endTime}
                  onChange={(e) => {
                    const it = [...(form.itinerary || [])];
                    it[i] = { ...it[i], endTime: e.target.value };
                    setForm({ ...form, itinerary: it });
                  }}
                  className="w-24 h-8 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const it = (form.itinerary || []).filter((_: any, idx: number) => idx !== i);
                    setForm({ ...form, itinerary: it });
                  }}
                  className="text-xs text-destructive hover:underline flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
            {(form.itinerary || []).length > 0 && (
              <p className="text-[10px] text-muted-foreground">
                Total: {(() => {
                  const it = form.itinerary || [];
                  if (it.length === 0) return "—";
                  const first = it[0];
                  const last = it[it.length - 1];
                  const [fh, fm] = (first.startTime || "09:00").split(":").map(Number);
                  const [lh, lm] = (last.endTime || "17:00").split(":").map(Number);
                  const mins = (lh * 60 + lm) - (fh * 60 + fm);
                  const hrs = mins / 60;
                  return `${hrs.toFixed(1)} hours (${hrs <= 4 ? "Half Day" : "Full Day"})`;
                })()}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave("DRAFT")} disabled={saving}>Save Draft</Button>
            <Button onClick={() => handleSave("PUBLISHED")} disabled={saving}>Publish</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
