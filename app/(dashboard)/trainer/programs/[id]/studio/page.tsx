"use client";

/**
 * Learning Studio Page
 *
 * Trainer-facing page at /trainer/programs/[id]/studio.
 * Allows uploading DOCX/PPTX files, watches AI generate slides, quiz,
 * and RAG embeddings, and provides export to PPTX/PDF/HTML.
 */

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Upload,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SlideDeck } from "@/components/studio/SlideDeck";
import { QuizRunner } from "@/components/studio/QuizRunner";
import { RAGChat } from "@/components/studio/RAGChat";
import { ExportMenu } from "@/components/studio/ExportMenu";
import { useAuth } from "@/components/AuthProvider";

interface StudioData {
  id: string;
  programTitle: string;
  slidesJson: string | null;
  status: "pending" | "generating" | "ready" | "failed";
  generatedAt: string | null;
  quiz?: {
    id: string;
    title: string;
    questions: Array<{
      id: string;
      text: string;
      type: string;
      options: string;
      points: number;
    }>;
  };
  errorMessage?: string | null;
  sourceFileUrl?: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudioPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [studio, setStudio] = useState<StudioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("slides");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Stable refs to avoid useEffect re-runs when router changes identity
  const idRef = useRef(id);
  const routerRef = useRef(router);
  idRef.current = id;
  routerRef.current = router;

  // Stable loadStudio: no dependencies, uses refs internally
  // (We don't useCallback here to keep identity truly stable.)
  const loadStudioRef = useRef<(showLoading?: boolean) => Promise<void>>(async () => {});
  loadStudioRef.current = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/trainer/programs/${idRef.current}/studio`);
      if (res.status === 401) {
        routerRef.current.push("/login");
        return;
      }
      if (res.status === 404) {
        setStudio(null);
        setError(null);
        return;
      }
      if (res.status === 403) {
        setError("You don't have access to this learning studio.");
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load studio (HTTP ${res.status})`);
      }
      const data = (await res.json()) as StudioData;
      setStudio(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load studio");
    } finally {
      setLoading(false);
    }
  };

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      routerRef.current.push("/login");
    }
  }, [user, authLoading]);

  // ── Load studio data (run once when user becomes available) ──────────
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!user || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    void loadStudioRef.current(true);
    // Reload if the program id changes (unusual, but correct)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  // ── Auto-refresh while generating ──────────────────────────────────────
  useEffect(() => {
    if (!studio || studio.status !== "generating") return;
    const timer = setInterval(() => {
      void loadStudioRef.current();
    }, 4000);
    return () => clearInterval(timer);
  }, [studio]);

  // ── File upload + generation ──────────────────────────────────────────
  async function handleFileUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      // Validate client-side
      const name = file.name.toLowerCase();
      if (!name.endsWith(".docx") && !name.endsWith(".pptx")) {
        throw new Error("Please upload a .docx or .pptx file.");
      }
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File is too large. Maximum size is 50MB.");
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/trainer/programs/${id}/studio`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let msg = "Upload failed";
        try {
          const data = await res.json();
          msg = data.error || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      // Reload to get updated studio data
      await loadStudioRef.current();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Reset studio ──────────────────────────────────────────────────────
  async function handleReset() {
    if (!confirm("Reset the studio? This will delete all slides and the quiz.")) {
      return;
    }
    try {
      const res = await fetch(`/api/trainer/programs/${id}/studio`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Reset failed");
      }
      setStudio(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error && !studio) {
    return (
      <div className="max-w-4xl mx-auto">
        <Header onBack={() => router.push(`/trainer/programs/${id}`)} title="Studio" />
        <div className="text-center py-16 space-y-4">
          <AlertCircle className="h-10 w-10 mx-auto text-rose-500" />
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => loadStudioRef.current(true)} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Header
        onBack={() => router.push(`/trainer/programs/${id}`)}
        title={studio?.programTitle ?? "Learning Studio"}
        subtitle="AI-powered slides, quiz, and chat — generated from your training material"
        right={
          studio && studio.slidesJson ? (
            <ExportMenu programId={id} />
          ) : (
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Export appears once slides are ready
            </span>
          )
        }
      />

      {/* Top error banner (non-fatal) */}
      {error ? (
        <div className="rounded-lg border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/20 p-3 flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-xs underline"
          >
            dismiss
          </button>
        </div>
      ) : null}

      {/* If no slides yet, show upload zone */}
      {!studio || !studio.slidesJson ? (
        <UploadZone
          uploading={uploading}
          status={studio?.status ?? null}
          hasStudio={!!studio}
          dragOver={dragOver}
          setDragOver={setDragOver}
          onFile={handleFileUpload}
          onRegenerate={() => fileInputRef.current?.click()}
          fileInputRef={fileInputRef}
        />
      ) : null}

      {/* Show SlideDeck + tabs once slides exist */}
      {studio && studio.slidesJson ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="slides">
              <BookOpen className="h-4 w-4 mr-1.5" />
              Slides
            </TabsTrigger>
            <TabsTrigger value="quiz" disabled={!studio.quiz}>
              <HelpCircle className="h-4 w-4 mr-1.5" />
              Quiz
              {!studio.quiz && (
                <span className="ml-1 text-[10px] text-slate-400">
                  (not generated)
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="slides">
            <SlideDeck
              slidesJson={studio.slidesJson}
              programTitle={studio.programTitle}
            />
            {studio.status === "ready" && studio.generatedAt ? (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Generated {new Date(studio.generatedAt).toLocaleString()}
                {" · "}
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-rose-600 hover:underline"
                >
                  Reset
                </button>
              </p>
            ) : null}
          </TabsContent>

          <TabsContent value="quiz">
            {studio.quiz ? (
              <QuizRunner
                quiz={{
                  id: studio.quiz.id,
                  title: studio.quiz.title,
                  questions: studio.quiz.questions.map((q) => ({
                    id: q.id,
                    text: q.text,
                    type: q.type,
                    options: q.options,
                    points: q.points,
                  })),
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Quiz not generated.
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat">
            <RAGChat
              programId={id}
              programTitle={studio.programTitle}
              className="h-[500px]"
            />
          </TabsContent>
        </Tabs>
      ) : null}

      {/* Floating regenerate button when slides are ready */}
      {studio && studio.slidesJson ? (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            )}
            Regenerate from new document
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.pptx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFileUpload(file);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-rose-600 hover:text-rose-700"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Reset studio
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function Header({
  onBack,
  title,
  subtitle,
  right,
}: {
  onBack: () => void;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={onBack}
          aria-label="Back to program"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function UploadZone({
  uploading,
  status,
  hasStudio,
  dragOver,
  setDragOver,
  onFile,
  onRegenerate,
  fileInputRef,
}: {
  uploading: boolean;
  status: StudioData["status"] | null;
  hasStudio: boolean;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFile: (file: File) => void;
  onRegenerate: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  // Generating state takes precedence
  if (status === "generating" || uploading) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-950/20 p-12">
        <div className="flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
          <div className="relative">
            <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
            <Sparkles className="h-5 w-5 text-amber-400 absolute -top-1 -right-1" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
              Generating Learning Studio
            </h2>
            <p className="text-sm text-amber-700/80 dark:text-amber-300/80 mt-1">
              Extracting text · Building knowledge base · Generating slides · Generating quiz.
              This usually takes 1–2 minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Ready state but somehow no slidesJson — show retry
  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        className={`rounded-2xl border-2 border-dashed p-12 transition text-center ${
          dragOver
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
            : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pptx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
        <div className="flex flex-col items-center space-y-4 max-w-md mx-auto">
          <div className="size-16 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
            <Upload className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {hasStudio ? "Upload a new document" : "Upload training material"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Drop a <strong>.docx</strong> or <strong>.pptx</strong> file here,
              or click to choose. AI will extract the content and generate
              slides, a quiz, and a chat assistant.
            </p>
          </div>
          <Button onClick={onRegenerate} size="lg">
            <FileText className="h-4 w-4 mr-2" />
            Choose document
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Max file size: 50MB · Supported formats: DOCX, PPTX
          </p>
        </div>
      </div>

      {hasStudio && status === "failed" ? (
        <div className="rounded-lg border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/20 p-3 flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Previous generation failed. Please try uploading again.</span>
        </div>
      ) : null}

      {hasStudio && status === "ready" ? (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            Existing studio found. Upload a new document to regenerate, or scroll up to view current slides.
          </span>
        </div>
      ) : null}
    </div>
  );
}
