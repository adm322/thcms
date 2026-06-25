"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import { Plus, BarChart3, Share2, Copy, HelpCircle, Users } from "lucide-react";

export default function TrainerQuizzesPage() {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([{ text: "", type: "MCQ", options: ["", "", "", ""], correctAnswer: "" }]);

  function fetchQuizzes() {
    setLoading(true);
    fetch("/api/trainer/quizzes").then(r => r.json()).then(setQuizzes).finally(() => setLoading(false));
  }
  useEffect(() => { fetchQuizzes(); }, []);

  async function createQuiz() {
    const res = await fetch("/api/trainer/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, questions: questions.filter(q => q.text) }),
    });
    if (res.ok) {
      toast("Quiz created!", "success");
      setShowCreate(false); setTitle(""); setQuestions([{ text: "", type: "MCQ", options: ["", "", "", ""], correctAnswer: "" }]);
      fetchQuizzes();
    }
  }

  function copyLink(url: string) { navigator.clipboard.writeText(window.location.origin + url); toast("Link copied!", "success"); }

  return (
    <div className="space-y-6 section-enter">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Quizzes & Polls</h1><p className="text-muted-foreground text-sm">Standalone quizzes shareable via link</p></div>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm"><Plus className="h-4 w-4 mr-1" />{showCreate ? "Cancel" : "Create Quiz"}</Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardContent className="space-y-4 pt-4">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quiz title..." className="text-sm" />
            {questions.map((q, i) => (
              <div key={i} className="space-y-2 p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                  <Input value={q.text} onChange={e => { const nq = [...questions]; nq[i].text = e.target.value; setQuestions(nq); }} placeholder="Question..." className="text-sm flex-1" />
                  <select value={q.type} onChange={e => { const nq = [...questions]; nq[i].type = e.target.value; setQuestions(nq); }} className="text-xs rounded border px-2 py-1">
                    <option value="MCQ">MCQ</option><option value="TRUE_FALSE">T/F</option><option value="SHORT_ANSWER">Short</option>
                  </select>
                </div>
                {(q.type === "MCQ" || q.type === "TRUE_FALSE") && (
                  <div className="grid grid-cols-2 gap-1">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-1">
                        <input type="radio" name={`correct-${i}`} checked={q.correctAnswer === opt} onChange={() => { const nq = [...questions]; nq[i].correctAnswer = opt; setQuestions(nq); }} />
                        <Input value={opt} onChange={e => { const nq = [...questions]; nq[i].options[oi] = e.target.value; setQuestions(nq); }} placeholder={`Option ${oi + 1}`} className="text-xs h-8" />
                      </div>
                    ))}
                  </div>
                )}
                <button className="text-[10px] text-red-500" onClick={() => setQuestions(questions.filter((_, qi) => qi !== i))}>Remove</button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuestions([...questions, { text: "", type: "MCQ", options: ["", "", "", ""], correctAnswer: "" }])}>+ Add Question</Button>
              <Button size="sm" onClick={createQuiz} disabled={!title}>Create Quiz</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz list */}
      {loading ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div> : quizzes.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><HelpCircle className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No quizzes yet. Create one to share with participants.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {quizzes.map(q => (
            <Card key={q.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center justify-between py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{q.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span><HelpCircle className="h-3 w-3 inline mr-0.5" />{q.questionCount} Q</span>
                    <span><Users className="h-3 w-3 inline mr-0.5" />{q.responseCount} responses</span>
                    <span>Pass: {q.passingScore}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {q.shareUrl && (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => copyLink(q.shareUrl)}><Share2 className="h-3.5 w-3.5 mr-0.5" />Copy Link</Button>
                  )}
                  <Link href={`/quiz/${q.shareToken}`} target="_blank"><Button variant="ghost" size="sm" className="text-xs"><BarChart3 className="h-3.5 w-3.5 mr-0.5" />Preview</Button></Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
