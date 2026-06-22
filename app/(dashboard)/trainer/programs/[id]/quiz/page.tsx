"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, HelpCircle } from "lucide-react";

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ moduleId: "", title: "", passingScore: 50, timeLimitMins: 30 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/trainer/programs/${id}/quizzes`).then((r) => r.json()),
      fetch(`/api/trainer/programs/${id}`).then((r) => r.json()),
    ])
      .then(([q, prog]) => { setQuizzes(q); setModules(prog.modules || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function createQuiz() {
    if (!form.moduleId || !form.title) return;
    setSaving(true);
    const res = await fetch(`/api/trainer/programs/${id}/quizzes/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const quiz = await res.json();
      setQuizzes([...quizzes, { ...quiz, questionCount: 0, moduleTitle: modules.find((m) => m.id === form.moduleId)?.title || "" }]);
      setOpen(false);
      setForm({ moduleId: "", title: "", passingScore: 50, timeLimitMins: 30 });
    }
    setSaving(false);
  }

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quizzes</h1>
        <Button onClick={() => setOpen(true)} disabled={modules.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Create Quiz
        </Button>
      </div>

      {modules.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <HelpCircle className="mb-4 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Add modules to this program first, then create quizzes per module.</p>
          </CardContent>
        </Card>
      )}

      {quizzes.length === 0 && modules.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <HelpCircle className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No quizzes yet</h3>
            <p className="text-sm text-muted-foreground">Create a quiz to assess participants after each module.</p>
            <Button className="mt-4" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Create Quiz</Button>
          </CardContent>
        </Card>
      ) : (
        quizzes.map((q) => (
          <Card key={q.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{q.title}</p>
                <p className="text-sm text-muted-foreground">
                  {q.moduleTitle && `${q.moduleTitle} • `}Pass: {q.passingScore}% • {q.timeLimitMins} min • {q.questionCount || q._count?.questions || 0} questions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/trainer/programs/${id}/quiz/questions?quizId=${q.id}`}>
                  <Button variant="outline" size="sm">Edit Questions</Button>
                </Link>
                <Link href={`/trainer/programs/${id}/quiz/results?quizId=${q.id}`}>
                  <Button variant="ghost" size="sm">Results</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Quiz</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Module</label>
              <select
                value={form.moduleId}
                onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="">Select a module...</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quiz Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Module 1 Assessment" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Passing Score (%)</label>
                <Input type="number" value={form.passingScore} onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })} min={0} max={100} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Limit (min)</label>
                <Input type="number" value={form.timeLimitMins} onChange={(e) => setForm({ ...form, timeLimitMins: Number(e.target.value) })} min={1} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createQuiz} disabled={!form.moduleId || !form.title || saving}>
              {saving ? "Creating..." : "Create Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
