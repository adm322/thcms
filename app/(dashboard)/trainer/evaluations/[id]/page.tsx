"use client";

import { useState, useEffect, use } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, BarChart3 } from "lucide-react";

export default function TrainerEvalDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [evaluation, setEvaluation] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/trainer/evaluations/${id}`)
      .then((r) => r.json())
      .then(setEvaluation)
      .catch(console.error);
  }, [id]);

  if (!evaluation) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  const questions = JSON.parse(evaluation.questions || "[]");
  const responses = JSON.parse(evaluation.responses || "[]");

  const questionScores: { question: string; type: string; avg: number; count: number }[] = questions
    .map((_: any, qi: number) => {
      const ratings = responses
        .flatMap((r: any) => r.answers || [])
        .filter((a: any) => a.questionIdx === qi && a.rating > 0)
        .map((a: any) => a.rating);
      return {
        question: questions[qi]?.question || `Q${qi + 1}`,
        type: questions[qi]?.type || "RATING",
        avg: ratings.length > 0 ? ratings.reduce((s: number, v: number) => s + v, 0) / ratings.length : 0,
        count: ratings.length,
      };
    })
    .filter((q: { type: string }) => q.type === "RATING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{evaluation.title}</h1>
        <p className="text-muted-foreground">
          {evaluation.completedAt
            ? `Completed ${new Date(evaluation.completedAt).toLocaleDateString("en-MY")}`
            : "Pending"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{evaluation.summaryScore?.toFixed(1) || "—"}</p><p className="text-xs text-muted-foreground">Overall / 5.0</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{responses.length}</p><p className="text-xs text-muted-foreground">Responses</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{questionScores.length}</p><p className="text-xs text-muted-foreground">Rated Questions</p></CardContent></Card>
      </div>

      {questionScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Your Performance by Question
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {questionScores.map((q, i) => {
              const pct = (q.avg / 5) * 100;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[70%]">{q.question}</span>
                    <span className="font-semibold flex items-center gap-1">
                      {q.avg.toFixed(1)} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${pct}%`,
                      background: pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#f43f5e",
                    }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{q.count} rating{q.count > 1 ? "s" : ""}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Text comments */}
      {responses.some((r: any) => r.answers?.some((a: any) => a.comment)) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Participant Comments</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {responses.map((r: any, ri: number) => {
              const comments = r.answers?.filter((a: any) => a.comment);
              if (!comments?.length) return null;
              return comments.map((a: any, ai: number) => (
                <div key={`${ri}-${ai}`} className="rounded-lg bg-accent/30 px-4 py-2 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">{r.participantId || `P${ri + 1}`}:</p>
                  "{a.comment}"
                </div>
              ));
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
