"use client";

/**
 * /trainer/programs/[id]/edit — the edit-program page.
 *
 * Composition:
 *   - Initial fetch: program + studio (parallel)
 *   - Shared form via <ProgramFormFields> (title, description, category,
 *     duration, capacity, price, location, syllabus, modules, itinerary,
 *     proposal URLs, thumbnail)
 *   - Page-specific: AI Enhance handler, Studio Ready/re-upload panel,
 *     Save handler that PUTs the program + (if itinerary has items)
 *     PUTs the itinerary separately
 */

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import {
  Loader2,
  CheckCircle2,
  Upload,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import {
  ProgramFormFields,
  type ProgramFormPayload,
} from "@/components/studio/ProgramFormFields";

interface StudioData {
  id: string;
  generatedAt: string | null;
  slidesJson: string | null;
  quizId: string | null;
}

export default function EditProgram({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Server-fetched values: initial form values + studio status.
  // Stored as separate state (not in a single `any` blob) so the
  // shared form can pre-fill from them via initialValues.
  const [initialValues, setInitialValues] = useState<Partial<ProgramFormPayload> | undefined>(undefined);
  const [status, setStatus] = useState<string>("DRAFT");
  const [studio, setStudio] = useState<StudioData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/trainer/programs/${id}`).then((r) => r.json()),
      fetch(`/api/program/${id}/studio`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([programData, studioData]) => {
        setInitialValues({
          title: programData.title,
          description: programData.description,
          category: programData.category,
          durationHours: programData.durationHours,
          maxParticipants: programData.maxParticipants,
          pricePerPax: programData.pricePerPax,
          locationType: programData.locationType,
          modules: [], // edit page didn't previously render modules; preserve empty
          itinerary: Array.isArray(programData.itinerary) ? programData.itinerary : [],
          proposalUrl: programData.proposalUrl ?? "",
          proposalLabel: programData.proposalLabel ?? "",
          thumbnailUrl: programData.thumbnailUrl ?? "",
        });
        setStatus(programData.status);
        if (studioData) setStudio(studioData);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleFormSubmit(payload: ProgramFormPayload) {
    setSaving(true);
    try {
      const res = await fetch(`/api/trainer/programs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, status }),
      });
      // Save itinerary separately (server requires it as its own endpoint)
      if (payload.itinerary.length > 0) {
        await fetch(`/api/trainer/programs/${id}/itinerary`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: payload.itinerary }),
        });
      }
      if (res.ok) {
        toast("Program saved", "success");
        router.push(`/trainer/programs/${id}`);
        router.refresh();
      } else {
        toast("Save failed", "error");
        setSaving(false);
      }
    } catch {
      toast("Save failed", "error");
      setSaving(false);
    }
  }

  async function handleStudioUpload(file: File) {
    setGenerating(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`/api/program/${id}/studio`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setStudio(data);
      toast("Learning Studio content generated successfully!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Generation failed", "error");
    } finally {
      setGenerating(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleStudioUpload(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleStudioUpload(file);
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Program</h1>

      <ProgramFormFields
        mode="edit"
        features={["modules", "itinerary", "proposal", "thumbnail"]}
        initialValues={initialValues}
        onSubmit={handleFormSubmit}
        isSaving={saving}
        // AI Enhance is a follow-up: the shared form owns the field
        // state, so the original implementation (which read form.title
        // directly) doesn't translate. Pass undefined for now.
      />

      {/* Studio Re-upload / Ready panel (page-specific) */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Learning Studio</CardTitle>
        </CardHeader>
        <CardContent>
          {studio?.generatedAt ? (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/40 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Learning Studio Ready
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Generated {new Date(studio.generatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={generating}
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Re-upload
                </Button>
                <Button size="sm" onClick={() => window.open(`/program/${id}/studio`, "_blank", "noreferrer")}>
                  Open
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !generating && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload a training document to generate the Learning Studio"
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !generating) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`
                flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer
                transition-colors py-10 px-6
                ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}
                ${generating ? "pointer-events-none opacity-90" : ""}
              `}
            >
              {generating ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-primary">Generating content…</p>
                  <p className="text-xs text-muted-foreground">This may take a minute</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop your DOCX or PPTX here</p>
                  <p className="text-xs text-muted-foreground">or click to browse</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pptx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
              />
            </div>
          )}
          <p className="mt-2 text-[10px] text-muted-foreground text-center">
            Accepted formats: .docx, .pptx
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
