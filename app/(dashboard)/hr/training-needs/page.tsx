"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Target, ArrowRight, CheckCircle2, Star, Users, Clock, DollarSign } from "lucide-react";
import Link from "next/link";

const QUESTIONS = [
  { question: "What is your biggest team challenge right now?", options: ["Communication gaps", "Low productivity", "High turnover", "Skill gaps", "Leadership issues"] },
  { question: "Which area needs most improvement?", options: ["Technical skills", "Soft skills", "Compliance knowledge", "Leadership ability", "Process efficiency"] },
  { question: "How many employees need training this year?", options: ["1-10", "11-30", "31-100", "100+"] },
  { question: "What is your training budget per person?", options: ["Under RM 500", "RM 500-1,000", "RM 1,000-2,000", "RM 2,000+"] },
  { question: "Preferred training format?", options: ["On-site", "Online", "Hybrid", "Flexible"] },
];

export default function TrainingNeedsPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);

  function selectAnswer(answer: string) {
    const newAnswers = [...answers, { question: QUESTIONS[step].question, answer }];
    setAnswers(newAnswers);
    
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      analyze(newAnswers);
    }
  }

  async function analyze(responses: { question: string; answer: string }[]) {
    setLoading(true);
    const res = await fetch("/api/ai/needs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses }),
    });
    if (res.ok) setResult(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    if (result && result.recommendedCategories?.length > 0) {
      setProgramsLoading(true);
      const params = new URLSearchParams();
      result.recommendedCategories.forEach((c: string) => params.append("category", c));
      fetch(`/api/hr/programs?${params.toString()}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setPrograms(data);
          else if (data.data) setPrograms(data.data);
        })
        .finally(() => setProgramsLoading(false));
    }
  }, [result]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Sparkles className="h-10 w-10 text-violet-500 animate-pulse mb-4" />
        <p className="text-lg font-semibold">Analyzing your training needs...</p>
        <p className="text-sm text-muted-foreground">AI is building your custom recommendation</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
          <h1 className="text-2xl font-bold">Your Training Roadmap</h1>
          <p className="text-muted-foreground">AI-powered recommendations based on your needs</p>
        </div>

        <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <h3 className="font-semibold text-violet-900">AI Analysis</h3>
            </div>
            <p className="text-sm text-violet-800">{result.explanation}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recommended Categories</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.recommendedCategories.map((cat: string, i: number) => (
                <Badge key={i} className="text-sm px-4 py-2 bg-violet-100 text-violet-700">{cat}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Suggested Programs</CardTitle></CardHeader>
          <CardContent>
            {programsLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
              </div>
            ) : programs.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {programs.slice(0, 6).map((prog: any) => (
                  <Link key={prog.id} href={`/hr/marketplace/${prog.id}`}
                    className="rounded-xl border p-4 hover:shadow-md hover:border-primary/30 transition-all card-lift"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-[10px]">{prog.category}</Badge>
                      <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{prog.trainerRating?.toFixed(1) || "—"}</span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold line-clamp-2 mb-2">{prog.title}</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1"><Users className="h-3 w-3" /> {prog.trainerName}</p>
                      <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> {prog.durationHours}h · {prog.locationType}</p>
                      <p className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> RM {prog.pricePerPax}/pax</p>
                    </div>
                    {prog.accreditations && prog.accreditations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {prog.accreditations.slice(0, 2).map((acc: string) => (
                          <span key={acc} className="text-[8px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-200">{acc}</span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Loading programs...</p>
            )}
            <Link href="/hr/marketplace" className="mt-4 inline-block">
              <Button><ArrowRight className="mr-2 h-4 w-4" />Browse All Programs</Button>
            </Link>
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full" onClick={() => { setStep(0); setAnswers([]); setResult(null); }}>
          Start New Analysis
        </Button>
      </div>
    );
  }

  const q = QUESTIONS[step];
  const progress = Math.round(((step) / QUESTIONS.length) * 100);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <Sparkles className="mx-auto h-10 w-10 text-violet-500 mb-3" />
        <h1 className="text-2xl font-bold">AI Training Needs Analyzer</h1>
        <p className="text-muted-foreground">Answer a few questions and get AI-powered training recommendations</p>
      </div>

      {/* Progress */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-violet-50 dark:bg-violet-950/300 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-center text-xs text-muted-foreground">Question {step + 1} of {QUESTIONS.length}</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{q.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {q.options.map((opt) => (
            <button
              key={opt}
              onClick={() => selectAnswer(opt)}
              className="w-full text-left rounded-lg border px-4 py-3 text-sm font-medium hover:bg-violet-50 dark:bg-violet-950/30 hover:border-violet-300 transition-colors"
            >
              {opt}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
