"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle, Sparkles, ExternalLink } from "lucide-react";

interface StudioStatus {
  status: "pending" | "generating" | "ready" | "failed";
  errorMessage?: string | null;
  generatedAt?: string | null;
  hasSlides?: boolean;
  hasQuiz?: boolean;
}

interface StudioStatusBannerProps {
  programId: string;
  /** When the banner mounts, the page may want to show it only if generation
   *  is in flight. Pass `false` to render a "Generate" CTA. */
  initialStatus?: StudioStatus | null;
}

/**
 * Studio status banner. Polls the trainer's program-studio endpoint every
 * 3 seconds while the status is "pending" or "generating", then stops.
 * Shows a CTA to open the studio when ready, or an error message on failure.
 */
export function StudioStatusBanner({ programId, initialStatus = null }: StudioStatusBannerProps) {
  const [status, setStatus] = useState<StudioStatus | null>(initialStatus);
  const [loading, setLoading] = useState(initialStatus === null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      if (cancelled) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/trainer/programs/${programId}/studio`);
        if (res.ok) {
          const data = (await res.json()) as StudioStatus;
          if (!cancelled) setStatus(data);
          setLoading(false);
          // If still in flight, poll again in 3s
          if (data.status === "pending" || data.status === "generating") {
            timer = setTimeout(poll, 3000);
          }
        } else if (res.status === 404) {
          // No studio yet — don't poll; user can upload to create one
          if (!cancelled) setStatus(null);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    }

    // Only poll if the initial status is in-flight; otherwise let the user
    // trigger generation manually from the edit page.
    if (initialStatus && (initialStatus.status === "pending" || initialStatus.status === "generating")) {
      poll();
    } else {
      setStatus(initialStatus);
      setLoading(false);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [programId, initialStatus]);

  if (loading && !status) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Checking studio status…</p>
      </div>
    );
  }

  // No studio at all — show a CTA to create one
  if (!status) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">No Learning Studio yet</p>
            <p className="text-xs text-muted-foreground">
              Upload a training document on the edit page to generate slides, a quiz, and an AI chat assistant.
            </p>
          </div>
        </div>
        <Link href={`/trainer/programs/${programId}/edit`}>
          <Button variant="outline" size="sm">
            Go to edit
            <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>
    );
  }

  if (status.status === "pending" || status.status === "generating") {
    return (
      <div
        className="rounded-lg border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex items-center gap-3"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-5 w-5 text-amber-600 animate-spin shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Generating Learning Studio…
          </p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
            Extracting text · Building knowledge base · Generating slides · Generating quiz. Usually 1–2 minutes.
          </p>
        </div>
      </div>
    );
  }

  if (status.status === "failed") {
    return (
      <div className="rounded-lg border border-rose-200 dark:border-rose-800/40 bg-rose-50/50 dark:bg-rose-950/20 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-rose-900 dark:text-rose-200">
            Studio generation failed
          </p>
          <p className="text-xs text-rose-700/80 dark:text-rose-300/80 break-words">
            {status.errorMessage ?? "Unknown error. You can try uploading the document again on the edit page."}
          </p>
        </div>
        <Link href={`/trainer/programs/${programId}/edit`}>
          <Button variant="outline" size="sm">Retry</Button>
        </Link>
      </div>
    );
  }

  // ready
  return (
    <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Learning Studio Ready
          </p>
          <p className="text-xs text-muted-foreground">
            {status.hasSlides ? "Slides · " : ""}
            {status.hasQuiz ? "Quiz · " : ""}
            Generated
            {status.generatedAt ? ` ${new Date(status.generatedAt).toLocaleDateString()}` : ""}
          </p>
        </div>
      </div>
      <Link href={`/trainer/programs/${programId}/studio`}>
        <Button size="sm">
          Open Studio
          <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </Link>
    </div>
  );
}
