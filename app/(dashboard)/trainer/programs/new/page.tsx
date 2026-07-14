"use client";

/**
 * /trainer/programs/new — the create-program page.
 *
 * Composition:
 *   - Upload hero with extract flow (trainer drops a DOCX/PPTX/PDF →
 *     AI auto-fills the form)
 *   - Shared form fields via <ProgramFormFields> (title, description,
 *     category, duration, capacity, price, location, syllabus, modules)
 *   - Floating action panel (right side): Save Draft / Save & Generate
 *     Studio / Publish
 *   - Full-page overlay shown when "Save & Generate Studio" is clicked,
 *     while the server runs the background slide/quiz generation
 *
 * The shared form fires onSubmit with a normalized payload; this page
 * decides what to do with it (POST /api/trainer/programs/batch).
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import {
  Sparkles,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import {
  ProgramFormFields,
  type ProgramFormPayload,
} from "@/components/studio/ProgramFormFields";
import { ProgramActionPanel } from "@/components/studio/ProgramActionPanel";
import { FloatingProgress, type FloatingProgressData } from "@/components/FloatingProgress";
import { FormChecklist, type FormChecklistState } from "@/components/studio/FormChecklist";
import type { ProgramDraft } from "@/lib/extract-program";

type ExtractStatus =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "extracting" }
  | { kind: "ai" }
  | { kind: "ready"; filename: string; uploadToken: string }
  | { kind: "error"; message: string };

export default function NewProgramPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [savedProgramId, setSavedProgramId] = useState<string | null>(null);
  const [floatingProgress, setFloatingProgress] = useState<FloatingProgressData | null>(null);
  const [studioStatus, setStudioStatus] = useState<
    "idle" | "pending" | "generating" | "ready" | "failed"
  >("idle");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<FormChecklistState>({
    title: false, description: false, category: false,
    numericFields: false, location: false, modules: false,
    itinerary: false, proposal: false,
  });

  // Upload state (page-specific — the extract flow is unique to /new)
  const [extract, setExtract] = useState<ExtractStatus>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);

  const uploadedFilename =
    extract.kind === "ready" ? extract.filename : undefined;

  // External submit trigger so the floating action panel can fire the
  // shared form's submit handler.
  const submitRef = useRef<() => void>(() => {});
  const triggerSubmit = useCallback(() => submitRef.current(), []);

  // Apply AI-extracted draft to the form via the shared form's API.
  // (The shared form reads `initialValues` only at mount, so to "fill
  // from extract" we remount the form with a key derived from the draft
  // — see <ProgramFormFields key={draftKey} ... /> below.)
  const [draftKey, setDraftKey] = useState(0);
  const [draftInitial, setDraftInitial] = useState<ProgramFormPayload | undefined>(undefined);

  function applyDraft(draft: ProgramDraft) {
    setDraftInitial({
      title: draft.title,
      description: draft.description,
      category: draft.category,
      durationHours: draft.durationHours,
      maxParticipants: draft.maxParticipants,
      pricePerPax: draft.pricePerPax,
      locationType: draft.locationType,
      modules: draft.modules.map((m) => ({ title: m.title, description: m.description, durationMins: m.durationMins })),
      itinerary: [],
    });
    setDraftKey((k) => k + 1);
  }

  function discardDraft() {
    setExtract({ kind: "idle" });
    setDraftInitial(undefined);
    setDraftKey((k) => k + 1);
  }

  async function handleFile(file: File) {
    setExtract({ kind: "uploading" });
    const fd = new FormData();
    fd.append("file", file);
    try {
      setExtract({ kind: "extracting" });
      const res = await fetch("/api/trainer/programs/extract", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      setExtract({ kind: "ai" });
      const draft: ProgramDraft = data.draft;
      applyDraft(draft);
      const token: string | undefined = (data as { uploadToken?: string }).uploadToken;
      setExtract({
        kind: "ready",
        filename: file.name,
        uploadToken: token ?? "",
      });
      toast(`Extracted "${draft.title}" from ${file.name}`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed";
      setExtract({ kind: "error", message });
      toast(message, "error");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // Called by the shared form when the user clicks "Submit" (which is
  // hidden in create mode because the action panel owns the buttons).
  // The action panel triggers this via `triggerSubmit`.
  async function handleFormSubmit(payload: ProgramFormPayload) {
    if (!payload.title.trim()) {
      toast("Program title is required", "error");
      return;
    }
    setSaving(true);
    setGenerationError(null);
    try {
      const enqueueStudio = Boolean(
        extract.kind === "ready" && extract.uploadToken
      );
      const uploadToken =
        enqueueStudio && extract.kind === "ready" ? extract.uploadToken : undefined;

      const res = await fetch("/api/trainer/programs/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          status: "PUBLISHED",
          ...(enqueueStudio && uploadToken
            ? { enqueueStudio: true, uploadToken }
            : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      const program = await res.json();
      toast(
        enqueueStudio
          ? `Program published — generating studio in the background…`
          : `Program published`,
        "success"
      );
      if (enqueueStudio) {
        setSavedProgramId(program.id);
        setStudioStatus("pending");
        setFloatingProgress({
          currentStep: 1,
          steps: [
            { id: "save", label: "Save program to database" },
            { id: "embed", label: "Build knowledge base (RAG)" },
            { id: "slides", label: "Generate slide deck" },
            { id: "quiz", label: "Generate assessment quiz" },
          ],
          elapsed: 0,
        });
      } else {
        router.push(`/trainer/programs/${program.id}`);
        router.refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast(message, "error");
      setSaving(false);
    }
  }

  // ─── Poll studio status + sync progress ──────────────────────────
  useEffect(() => {
    if (!savedProgramId) return;
    if (studioStatus === "ready" || studioStatus === "failed") return;

    let targetStep = 1;
    let cancelled = false;
    const startTs = Date.now();

    const tick = async () => {
      try {
        const res = await fetch(`/api/trainer/programs/${savedProgramId}/studio`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setStudioStatus(data.status ?? "pending");

          // Map server status → step index (0-based, 0-3)
          const serverStep =
            data.status === "pending" || data.status === "generating"
              ? 1
              : data.status === "ready"
                ? 4
                : 1;
          targetStep = Math.max(1, serverStep);

          setFloatingProgress((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              currentStep: serverStep + (data.status === "ready" ? 1 : 0),
              elapsed: Math.floor((Date.now() - startTs) / 1000),
              errorMessage: data.errorMessage ?? undefined,
            };
          });
        }
      } catch {
        /* network blip */
      }
    };

    tick();
    const id = setInterval(() => {
      tick();
      // Also advance the step illusion even if no server response
      setFloatingProgress((prev) => {
        if (!prev || prev.currentStep >= prev.steps.length - 1) return prev;
        // Slowly advance through steps as time passes (client-side)
        const elapsed = Math.floor((Date.now() - startTs) / 1000);
        const estimatedStep = Math.min(prev.steps.length, 1 + Math.floor(elapsed / 20));
        return { ...prev, currentStep: Math.max(prev.currentStep, estimatedStep), elapsed };
      });
    }, 4000);

    return () => { cancelled = true; clearInterval(id); };
  }, [savedProgramId, studioStatus]);

  const handleCancel = useCallback(() => {
    router.push("/trainer/programs");
  }, [router]);

  const isExtracting =
    extract.kind === "uploading" ||
    extract.kind === "extracting" ||
    extract.kind === "ai";
  const hasDraft = extract.kind === "ready";
  const canGenerateStudio = hasDraft && Boolean(extract.uploadToken);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          aria-label="Back to programs"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Program</h1>
          <p className="text-sm text-muted-foreground">
            Drop a training document to auto-fill, or fill the form manually below.
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-6">
          {/* Hero: Upload zone */}
          <Card className={hasDraft ? "border-emerald-200 dark:border-emerald-800/40" : "border-primary/20"}>
            <CardHeader className="flex-row items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">
                {hasDraft ? "Extracted from your document" : "From a training document"}
              </CardTitle>
              {hasDraft ? (
                <span className="ml-auto text-xs text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={discardDraft}
                    aria-label="Discard extracted draft and start over"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Discard
                  </Button>
                </span>
              ) : null}
            </CardHeader>
            <CardContent>
              {hasDraft ? (
                <ExtractSuccess
                  filename={extract.filename}
                  title={draftInitial?.title ?? "Program"}
                  onReplace={() => fileInputRef.current?.click()}
                />
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !isExtracting && fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload a training document to auto-fill the form"
                  aria-busy={isExtracting}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !isExtracting) {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`
                    flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer
                    transition-colors py-10 px-6
                    ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}
                    ${isExtracting ? "pointer-events-none opacity-90" : ""}
                  `}
                >
                  {isExtracting ? (
                    <ExtractingProgress step={extract.kind} />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Drop your DOCX, PPTX, or PDF here</p>
                      <p className="text-xs text-muted-foreground">
                        AI will extract title, description, syllabus, and modules
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-hidden="true"
                  />
                </div>
              )}

              {extract.kind === "error" ? (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800/50 p-3 text-sm text-rose-700 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Couldn&apos;t extract from this file</p>
                    <p className="text-xs mt-0.5 text-rose-600/80 dark:text-rose-400/80">
                      {extract.message} You can still fill in the form manually below.
                    </p>
                  </div>
                </div>
              ) : null}

              <p className="mt-2 text-[10px] text-muted-foreground text-center">
                Accepted formats: .docx, .pptx, .pdf · Max 25 MB
              </p>
            </CardContent>
          </Card>

          {/* Shared form fields */}
          <ProgramFormFields
            key={draftKey}
            mode="create"
            features={["modules"]}
            initialValues={draftInitial}
            onSubmit={handleFormSubmit}
            isSaving={saving}
            registerFormSubmit={(fn) => {
              submitRef.current = fn;
            }}
            onFieldChange={(p) => {
              setChecklist({
                title: p.title.trim().length > 0,
                description: p.description.trim().length > 0,
                category: p.category.length > 0,
                numericFields: p.durationHours > 0 && p.maxParticipants > 0 && p.pricePerPax > 0,
                location: p.locationType.length > 0,
                modules: p.modules.length > 0 && p.modules[0]?.title.trim().length > 0,
                itinerary: p.itinerary.length > 0,
                proposal: (p.proposalContent?.length ?? 0) > 0,
              });
            }}
          />
        </div>
        {/* End of left column */}

        {/* Right column */}
        <div className="space-y-4">
        <ProgramActionPanel
          titleValid={(draftInitial?.title ?? "").trim().length > 0}
          canGenerateStudio={canGenerateStudio}
          saving={saving}
          onCancel={handleCancel}
          onSaveDraft={triggerSubmit}
          onSaveAndGenerate={triggerSubmit}
          onPublish={triggerSubmit}
        />

        <FormChecklist state={checklist} />
      </div>
      </div>

      {/* Floating progress indicator (bottom-right) */}
      <FloatingProgress
        data={floatingProgress}
        onDismiss={() => {
          setFloatingProgress(null);
          if (savedProgramId) {
            router.push(`/trainer/programs/${savedProgramId}`);
          }
        }}
      />
    </div>
  );
}

function ExtractingProgress({ step }: { step: "uploading" | "extracting" | "ai" }) {
  const STEPS = [
    { key: "uploading", label: "Uploading file" },
    { key: "extracting", label: "Extracting text" },
    { key: "ai", label: "AI is filling the form" },
  ];
  const currentIdx = STEPS.findIndex((s) => s.key === step);
  return (
    <div className="w-full max-w-sm space-y-3">
      <Loader2 className="h-7 w-7 animate-spin text-primary mx-auto" />
      <p className="text-sm font-medium text-foreground">{STEPS[currentIdx]?.label}</p>
      <ol className="space-y-1.5 text-left">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex items-center gap-2 text-xs">
            {i < currentIdx ? (
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
            ) : i === currentIdx ? (
              <Loader2 className="size-3.5 text-primary animate-spin shrink-0" />
            ) : (
              <span className="size-3.5 rounded-full border border-border shrink-0" />
            )}
            <span className={i <= currentIdx ? "text-foreground" : "text-muted-foreground"}>
              {s.label}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-[10px] text-muted-foreground">Usually takes 5–15 seconds.</p>
    </div>
  );
}

function ExtractSuccess({
  filename,
  title,
  onReplace,
}: {
  filename: string;
  title: string;
  onReplace: () => void;
}) {
  return (
    <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Extracted from {filename}
          </p>
          <p className="text-xs text-muted-foreground">
            Review the form below and edit anything that needs adjustment.
          </p>
        </div>
      </div>
      <div className="text-xs bg-background/60 rounded-md px-3 py-2 border border-emerald-200/60">
        <span className="text-muted-foreground">Detected title:</span>{" "}
        <span className="font-medium">{title}</span>
      </div>
      <Button variant="outline" size="sm" onClick={onReplace}>
        <Upload className="h-3.5 w-3.5 mr-1.5" />
        Replace with different file
      </Button>
    </div>
  );
}
