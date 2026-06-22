"use client";

import { useState, useEffect, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

function ResultsView({ programId, quizId }: { programId: string; quizId: string }) {
  const [quiz, setQuiz] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!quizId) return;
    fetch(`/api/trainer/quizzes/${quizId}`).then((r) => r.json()).then(setQuiz).catch(console.error);
    fetch(`/api/trainer/quizzes/${quizId}/results`).then((r) => r.json()).then(setParticipants).catch(console.error);
  }, [quizId]);

  const passCount = participants.filter((p) => p.quizScore != null && p.quizScore >= (quiz?.passingScore || 0)).length;
  const avgScore = participants.filter((p) => p.quizScore != null).reduce((s, p) => s + p.quizScore!, 0) / (participants.filter((p) => p.quizScore != null).length || 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quiz Results</h1>
        <p className="text-muted-foreground">{quiz?.title || "Loading..."}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{participants.length}</p><p className="text-xs text-muted-foreground">Participants</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{avgScore.toFixed(0)}%</p><p className="text-xs text-muted-foreground">Avg Score</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{passCount}/{participants.length}</p><p className="text-xs text-muted-foreground">Passed (≥{quiz?.passingScore || 0}%)</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Participant Scores</CardTitle></CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No participant data yet.</p>
          ) : (
            <div className="space-y-2">
              {participants.map((p) => {
                const passed = p.quizScore != null && p.quizScore >= (quiz?.passingScore || 0);
                const pct = p.quizScore || 0;
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
                    <div className={`flex-shrink-0 rounded-full p-1 ${passed ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                      {p.quizScore != null ? (passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />) : <HelpCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.department || "N/A"} • {p.attendanceStatus}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {p.quizScore != null && (
                        <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${passed ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      <span className="font-semibold text-sm w-12 text-right">{p.quizScore != null ? `${p.quizScore}%` : "—"}</span>
                      <Badge variant={passed ? "default" : "destructive"} className="text-[10px]">{passed ? "PASS" : "FAIL"}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function QuizResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading...</div>}>
      <QuizResultsContent programId={id} />
    </Suspense>
  );
}

function QuizResultsContent({ programId }: { programId: string }) {
  const searchParams = useSearchParams();
  const quizId = searchParams.get("quizId");
  if (!quizId) return <div className="py-20 text-center"><HelpCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" /><p className="text-muted-foreground">Select a quiz to view results.</p></div>;
  return <ResultsView programId={programId} quizId={quizId} />;
}
