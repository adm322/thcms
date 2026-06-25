"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, FileText } from "lucide-react";

export default function TrainerEvaluations() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trainer/evaluations")
      .then((r) => r.json())
      .then(setEvaluations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  const avgScore = evaluations.length > 0
    ? (evaluations.reduce((s, e) => s + (e.summaryScore || 0), 0) / evaluations.filter((e) => e.summaryScore).length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Program Evaluations</h1>
        <p className="text-muted-foreground">Feedback from your past training programs</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{evaluations.length}</p>
            <p className="text-xs text-muted-foreground">Total Evaluations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold flex items-center justify-center gap-1">
              {avgScore} <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </p>
            <p className="text-xs text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">
              {evaluations.filter((e) => e.summaryScore && e.summaryScore >= 4).length}
            </p>
            <p className="text-xs text-muted-foreground">Rated ≥ 4.0</p>
          </CardContent>
        </Card>
      </div>

      {/* Evaluations List */}
      {evaluations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No evaluations yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Evaluations will appear here after your programs are completed and HR submits feedback.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {evaluations.map((e) => (
            <Link key={e.id} href={`/trainer/evaluations/${e.id}`} className="block">
              <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{e.programTitle}</p>
                      <Badge variant="outline" className="text-[10px]">{e.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {e.companyName} • {new Date(e.programDate).toLocaleDateString("en-MY")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {e.summaryScore ? (
                      <span className="flex items-center gap-1 text-sm font-semibold">
                        {e.summaryScore.toFixed(1)} <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      </span>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                    )}
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
