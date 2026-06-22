"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Send } from "lucide-react";

export default function HREvaluations() {
  const [evals, setEvals] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/hr/evaluations").then((r) => r.json()).then(setEvals).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Evaluations</h1>
      <div className="space-y-2">
        {evals.map((e) => (
          <Link key={e.id} href={`/hr/evaluations/${e.id}/summary`}>
            <Card className="hover:bg-accent/50 cursor-pointer">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-sm text-muted-foreground">{e.programTitle} • Completed {e.completedAt ? new Date(e.completedAt).toLocaleDateString("en-MY") : "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  {e.summaryScore && (
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {e.summaryScore.toFixed(1)}
                    </span>
                  )}
                  <Badge variant={e.completedAt ? "default" : "secondary"}>
                    {e.completedAt ? "Completed" : "Pending"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {evals.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Star className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">No Evaluations Yet</h3>
              <p className="text-sm text-muted-foreground">Evaluations are created after program completion.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
