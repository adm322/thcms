"use client";

import { useState, useEffect, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Save, X, GripVertical, HelpCircle, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const QUESTION_TYPES = ["MCQ", "TRUE_FALSE", "SHORT_ANSWER"];

function QuestionEditor({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState<any>({ text: "", type: "MCQ", options: ["", "", "", ""], correctAnswer: "", points: 1 });

  useEffect(() => {
    fetch(`/api/trainer/quizzes/${quizId}`).then((r) => r.json()).then(setQuiz).catch(console.error);
    fetch(`/api/trainer/quizzes/${quizId}/questions`).then((r) => r.json()).then(setQuestions).catch(console.error);
  }, [quizId]);

  function resetForm() {
    setForm({ text: "", type: "MCQ", options: ["", "", "", ""], correctAnswer: "", points: 1 });
    setEditing(null);
  }

  async function handleSave() {
    if (editing) {
      await fetch(`/api/trainer/questions/${editing}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, options: form.type === "TRUE_FALSE" ? ["True", "False"] : form.options }),
      });
    } else {
      await fetch(`/api/trainer/quizzes/${quizId}/questions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, options: form.type === "TRUE_FALSE" ? ["True", "False"] : form.options }),
      });
    }
    const res = await fetch(`/api/trainer/quizzes/${quizId}/questions`);
    setQuestions(await res.json());
    resetForm();
  }

  async function deleteQuestion(qId: string) {
    await fetch(`/api/trainer/questions/${qId}`, { method: "DELETE" });
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  }

  async function aiGenerate() {
    setAiLoading(true);
    const res = await fetch("/api/ai/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: quiz?.title || "training", count: 5 }),
    });
    if (res.ok) {
      const data = await res.json();
      for (const q of data.questions) {
        await fetch(`/api/trainer/quizzes/${quizId}/questions`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q),
        });
      }
      const refresh = await fetch(`/api/trainer/quizzes/${quizId}/questions`);
      setQuestions(await refresh.json());
    }
    setAiLoading(false);
  }

  function startEdit(q: any) {
    setEditing(q.id);
    const opts = Array.isArray(q.options) ? q.options : [];
    setForm({ text: q.text, type: q.type, options: opts.length >= 4 ? opts : [...opts, ...Array(4 - opts.length).fill("")], correctAnswer: q.correctAnswer, points: q.points });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quiz Questions</h1>
          <p className="text-muted-foreground">{quiz?.title || "Loading..."} — Pass: {quiz?.passingScore}%</p>
        </div>
        {!editing && <div className="flex gap-2"><Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" />Add Question</Button><Button variant="outline" onClick={aiGenerate} disabled={aiLoading}><Sparkles className="mr-2 h-4 w-4" />{aiLoading ? "Generating..." : "AI Generate"}</Button></div>}
      </div>

      {(editing || questions.length === 0) && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editing ? "Edit Question" : "New Question"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Question text" />
            <div className="flex gap-2">
              {QUESTION_TYPES.map((t) => (
                <button key={t} onClick={() => setForm({ ...form, type: t })} className={`rounded-full px-3 py-1 text-xs font-medium ${form.type === t ? "bg-primary text-primary-foreground" : "bg-accent"}`}>{t.replace("_", " ")}</button>
              ))}
            </div>
            {form.type === "MCQ" && form.options.map((opt: string, i: number) => (
              <div key={i} className="flex gap-2">
                <Input value={opt} onChange={(e) => { const o = [...form.options]; o[i] = e.target.value; setForm({ ...form, options: o }); }} placeholder={`Option ${i + 1}`} />
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" onClick={() => setForm({ ...form, correctAnswer: opt })}>
                      {form.correctAnswer === opt ? "✅" : "⬜"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Set correct</TooltipContent>
                </Tooltip>
              </div>
            ))}
            {form.type === "TRUE_FALSE" && (
              <div className="flex gap-2">{[ "True","False"].map(v => <Button key={v} variant={form.correctAnswer === v ? "default":"outline"} size="sm" onClick={() => setForm({ ...form, correctAnswer: v })}>{v}</Button>)}</div>
            )}
            {form.type === "SHORT_ANSWER" && <Input value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} placeholder="Correct answer" />}
            <div className="flex gap-2">
              <Input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} className="w-24" placeholder="Points" />
              <Button onClick={handleSave} disabled={!form.text.trim()}><Save className="mr-2 h-4 w-4" />{editing ? "Update" : "Save"}</Button>
              {editing && <Button variant="ghost" onClick={resetForm}><X className="mr-2 h-4 w-4" />Cancel</Button>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {questions.map((q, i) => (
          <Card key={q.id} className={editing === q.id ? "ring-2 ring-primary" : ""}>
            <CardContent className="flex items-center gap-3 py-3">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Badge variant="outline" className="text-[10px] flex-shrink-0">{q.type}</Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{i + 1}. {q.text}</p>
                <p className="text-xs text-muted-foreground">Answer: {q.correctAnswer} • {q.points} pt</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => startEdit(q)}>Edit</Button>
              <Button variant="ghost" size="icon" onClick={() => deleteQuestion(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent>
          </Card>
        ))}
        {questions.length === 0 && !editing && (
          <p className="py-8 text-center text-sm text-muted-foreground">No questions yet. Click "Add Question" to start.</p>
        )}
      </div>
    </div>
  );
}

export default function QuizQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading questions...</div>}>
      <QuizQuestionsContent params={params} />
    </Suspense>
  );
}

function QuizQuestionsContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: programId } = use(params);
  const searchParams = useSearchParams();
  const quizId = searchParams.get("quizId");

  if (!quizId) {
    return (
      <div className="py-20 text-center">
        <HelpCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Select a quiz from the Quiz page to manage questions.</p>
      </div>
    );
  }

  return <QuestionEditor quizId={quizId} />;
}
