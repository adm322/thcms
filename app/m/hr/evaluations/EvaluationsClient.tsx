"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, ChevronRight, FileText } from "lucide-react";

interface Evaluation {
  id: string;
  title: string;
  programTitle: string;
  summaryScore: number | null;
  sentAt: string | null;
  completedAt: string | null;
}

export function EvaluationsClient() {
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hr/evaluations")
      .then((r) => r.json())
      .then(setEvals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-card border border-border p-4 animate-pulse">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-4 bg-muted rounded-full w-16" />
                <div className="h-4 bg-muted rounded-full w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (evals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
        <Star className="mx-auto size-8 text-muted-foreground/40 mb-2" />
        <h2 className="text-sm font-semibold">No Evaluations Yet</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
          Evaluations are created after program completion.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {evals.map((e) => (
        <Link
          key={e.id}
          href={`/hr/evaluations/${e.id}/summary`}
          className="block bg-card border border-border rounded-2xl p-4 active:scale-[0.99] transition-transform"
        >
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-muted grid place-items-center shrink-0">
              <FileText className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-tight">{e.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{e.programTitle}</div>
              <div className="flex items-center gap-2 mt-2">
                {e.summaryScore != null && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {e.summaryScore.toFixed(1)}
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    e.completedAt
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {e.completedAt ? "Completed" : "Pending"}
                </span>
                {e.completedAt && (
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(e.completedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
          </div>
        </Link>
      ))}
    </div>
  );
}
