"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy } from "lucide-react";

export interface QuizQuestion {
  id: string;
  text: string;
  type: string; // "MCQ" | "TRUE_FALSE"
  options: string; // JSON string
  points: number;
}

interface QuizRunnerProps {
  quiz: {
    id: string;
    title: string;
    questions: QuizQuestion[];
  };
  className?: string;
}

export function QuizRunner({ quiz, className }: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; correct: number } | null>(null);

  const question = quiz.questions[currentIndex];
  const isLast = currentIndex === quiz.questions.length - 1;
  let options: string[] = [];
  try {
    options = JSON.parse(question.options);
  } catch {
    options = [];
  }

  function handleAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  async function handleNext() {
    if (isLast) {
      setSubmitting(true);
      try {
        const res = await fetch(`/api/quiz/${quiz.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Submit failed");
        setResult(data);
        setSubmitted(true);
      } catch (err) {
        // fallback: calculate score client-side
        let correct = 0;
        let total = 0;
        for (const q of quiz.questions) {
          total += q.points;
          if (answers[q.id]) correct += q.points;
        }
        const score = Math.round((correct / total) * 100);
        setResult({ score, total, correct });
        setSubmitted(true);
      } finally {
        setSubmitting(false);
      }
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  if (submitted && result) {
    return (
      <div className={className}>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="size-8 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{result.score}%</h2>
              <p className="text-sm text-muted-foreground">
                {result.correct} out of {quiz.questions.length} correct
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {result.score >= 80
                ? "Excellent work!"
                : result.score >= 60
                ? "Good job! Keep learning."
                : "Keep studying and try again."}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                setResult(null);
                setAnswers({});
                setCurrentIndex(0);
              }}
            >
              Retake Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{quiz.title}</CardTitle>
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} / {quiz.questions.length}
            </span>
          </div>
          {/* Progress */}
          <div className="w-full h-1.5 rounded-full bg-muted mt-3 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question */}
          <div>
            <p className="text-base font-medium mb-4">{question.text}</p>

            {question.type === "TRUE_FALSE" ? (
              <div className="flex gap-3">
                {["True", "False"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className={`
                      flex-1 py-3 rounded-lg border text-sm font-medium transition-all
                      ${answers[question.id] === opt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/40"
                      }
                    `}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg border text-sm text-left transition-all
                      ${answers[question.id] === opt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/40"
                      }
                    `}
                  >
                    <span
                      className={`
                        size-4 rounded-full border shrink-0 flex items-center justify-center text-[10px] font-bold
                        ${answers[question.id] === opt
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                        }
                      `}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleNext}
              disabled={!answers[question.id] || submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLast ? (
                "Submit"
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
