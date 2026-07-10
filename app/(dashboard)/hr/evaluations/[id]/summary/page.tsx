"use client";

import { useState, useEffect, use, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, Download, QrCode, FileText, BarChart3, Sparkles } from "lucide-react";
import Image from "next/image";

export default function EvaluationSummary({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch(`/api/hr/evaluations/${id}`)
      .then((r) => r.json())
      .then(setEvaluation)
      .catch(console.error);
  }, [id]);

  // Generate QR code on canvas
  useEffect(() => {
    if (typeof window !== "undefined" && evaluation) {
      import("qrcode").then((QRCode) => {
        const canvas = document.createElement("canvas");
        QRCode.toCanvas(canvas, `${window.location.origin}/hr/evaluations/${id}/summary`, {
          width: 200, margin: 2, color: { dark: "#171717", light: "#ffffff" },
        });
        setQrDataUrl(canvas.toDataURL());
      }).catch(console.error);
    }
  }, [id, evaluation]);

  if (!evaluation) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  const questions = JSON.parse(evaluation.questions || "[]");
  const responses = JSON.parse(evaluation.responses || "[]");

  // Per-question average scores
  const questionScores: { question: string; type: string; avg: number; count: number }[] = questions.map((_: any, qi: number) => {
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
  }).filter((q: { type: string }) => q.type === "RATING");

  // PDF export
  async function downloadPDF() {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text(evaluation.title, 20, y); y += 10;
    doc.setFontSize(12);
    doc.text(`Score: ${evaluation.summaryScore?.toFixed(1) || "N/A"} / 5.0  |  ${responses.length} responses`, 20, y); y += 10;
    doc.text(`Date: ${evaluation.completedAt ? new Date(evaluation.completedAt).toLocaleDateString("en-MY") : "Pending"}`, 20, y); y += 12;

    questionScores.forEach((q, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.text(`${i + 1}. ${q.question} — avg ${q.avg.toFixed(1)}/5 (${q.count} ratings)`, 20, y);
      y += 8;
    });
    y += 6;

    responses.slice(0, 10).forEach((r: any) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const ratings = r.answers?.filter((a: any) => a.rating > 0).map((a: any) => a.rating) || [];
      const avgR = ratings.length > 0 ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : "—";
      doc.text(`${r.participantId || "Anonymous"}: avg ${avgR}/5`, 20, y);
      y += 6;
    });

    doc.save(`evaluation-${id.slice(-6)}.pdf`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{evaluation.title}</h1>
          <p className="text-muted-foreground">
            {evaluation.completedAt ? `Completed ${new Date(evaluation.completedAt).toLocaleDateString("en-MY")}` : "Pending"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadPDF}>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview"><BarChart3 className="mr-1 h-4 w-4" />Performance</TabsTrigger>
          <TabsTrigger value="responses"><FileText className="mr-1 h-4 w-4" />Responses</TabsTrigger>
          <TabsTrigger value="qrcode"><QrCode className="mr-1 h-4 w-4" />QR Code</TabsTrigger>
          <TabsTrigger value="ai"><Sparkles className="mr-1 h-4 w-4" />AI Insights</TabsTrigger>
        </TabsList>

        {/* ── PERFORMANCE GRAPH ── */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{evaluation.summaryScore?.toFixed(1) || "—"}</p><p className="text-xs text-muted-foreground">Overall / 5.0</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{responses.length}</p><p className="text-xs text-muted-foreground">Responses</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{questionScores.length}</p><p className="text-xs text-muted-foreground">Rated Questions</p></CardContent></Card>
          </div>

          {questionScores.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Trainer Performance by Question</CardTitle></CardHeader>
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
                        <div className="h-full rounded-full transition-all duration-500" style={{
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

          <Card>
            <CardHeader><CardTitle className="text-base">Rating Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {questionScores.map((q, i) => {
                  const label = q.avg >= 4.5 ? "Excellent" : q.avg >= 4 ? "Very Good" : q.avg >= 3 ? "Good" : q.avg >= 2 ? "Fair" : "Needs Work";
                  const cls = q.avg >= 4 ? "bg-emerald-100 text-emerald-700" : q.avg >= 3 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                  return <Badge key={i} variant="outline" className={cls}>{q.question.slice(0, 25)}…: {label}</Badge>;
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RESPONSES ── */}
        <TabsContent value="responses" className="mt-4 space-y-4">
          {questions.map((q: any, qi: number) => (
            <Card key={qi}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{qi + 1}</span>
                  {q.question}
                  <Badge variant="outline" className="text-[10px]">{q.type}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {q.type === "RATING" ? (
                  <div className="space-y-2">
                    {responses.map((r: any, ri: number) => {
                      const rating = r.answers?.[qi]?.rating || 0;
                      return (
                        <div key={ri} className="flex items-center justify-between rounded-lg bg-accent/30 px-4 py-2">
                          <span className="text-sm">{r.participantId || `P${ri + 1}`}</span>
                          <span className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {responses.filter((r: any) => r.answers?.[qi]?.comment).map((r: any, ri: number) => (
                      <div key={ri} className="rounded-lg bg-accent/30 px-4 py-2 text-sm">
                        <p className="text-xs text-muted-foreground mb-1">{r.participantId || `P${ri + 1}`}:</p>
                        "{r.answers[qi].comment}"
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── QR CODE ── */}
        <TabsContent value="qrcode" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Evaluation QR Code</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              {qrDataUrl ? (
                <div className="rounded-xl border bg-white p-6">
                  <Image src={qrDataUrl} alt="QR Code" width={200} height={200} priority className="size-52" />
                </div>
              ) : (
                <div className="size-52 bg-muted rounded-xl animate-pulse" />
              )}
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Scan to open this evaluation. Print or share with stakeholders.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => {
                  if (qrDataUrl) {
                    const a = document.createElement("a");
                    a.href = qrDataUrl; a.download = `qr-eval-${id.slice(-6)}.png`; a.click();
                  }
                }}>
                  <Download className="mr-2 h-4 w-4" /> Download QR
                </Button>
                <Button variant="outline" size="sm" onClick={downloadPDF}>
                  <FileText className="mr-2 h-4 w-4" /> Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ai" className="mt-4">
          {aiInsights ? (
            <div className="space-y-4">
              <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-violet-600" />
                    <h3 className="font-semibold text-violet-900">AI Analysis</h3>
                    <Badge className={`text-[10px] ${
                      aiInsights.sentiment === "positive" ? "bg-emerald-100 text-emerald-700" :
                      aiInsights.sentiment === "negative" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>{aiInsights.sentiment.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-violet-800">{aiInsights.summary}</p>
                </CardContent>
              </Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base text-emerald-700">💪 Strengths</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {aiInsights.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> {s}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base text-amber-700">🔧 Improvements</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {aiInsights.improvements.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">→</span> {s}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader><CardTitle className="text-base">Key Themes</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {aiInsights.themes.map((t: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-violet-50 text-violet-700">{t}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Sparkles className="mb-4 h-10 w-10 text-violet-300" />
                <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
                <p className="text-sm text-muted-foreground mt-1">Analyze all participant comments to identify key themes, strengths, and areas for improvement.</p>
                <Button className="mt-4" onClick={async () => {
                  setAiLoading(true);
                  const comments = responses.flatMap((r: any) => r.answers || []).filter((a: any) => a.comment).map((a: any) => ({ participant: "Participant", text: a.comment }));
                  const res = await fetch("/api/ai/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comments }) });
                  if (res.ok) setAiInsights(await res.json());
                  setAiLoading(false);
                }} disabled={aiLoading}>
                  <Sparkles className="mr-2 h-4 w-4" />{aiLoading ? "Analyzing..." : "Analyze with AI"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
