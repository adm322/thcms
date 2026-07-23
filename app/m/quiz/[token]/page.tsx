"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Award,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

type Screen = "loading" | "intro" | "quiz" | "results";

export default function MobilePublicQuiz({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [screen, setScreen] = useState<Screen>("loading");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [passed, setPassed] = useState(false);
  const [previousAttempts, setPreviousAttempts] = useState<{ score: number; passed: boolean; attemptNumber: number; createdAt: string }[]>([]);

  useEffect(() => {
    fetch(`/api/quiz/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.quiz) {
          setQuiz(data.quiz);
          setQuestions(data.questions);
          setBookingId(data.bookingId || null);
          setScreen("intro");
        } else {
          setScreen("results");
        }
      })
      .catch(() => setScreen("results"));
  }, [token]);

  async function submit() {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/quiz/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
        setPassed(data.passed);
        setAttemptNumber(data.attemptNumber);
        setPreviousAttempts(data.previousAttempts || []);
        setScreen("results");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      submit();
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setScore(0);
    setScreen("intro");
  };

  if (screen === "loading") {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-violet-600/10 blur-xl rounded-full" />
          <Clock className="h-10 w-10 text-violet-600 animate-spin relative z-10" />
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-slate-400 text-lg font-light tracking-wider mb-4">
          Quiz not found or expired
        </p>
        <Link
          href="/m"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600"
        >
          <ArrowLeft className="size-4" /> Back to TrainHub
        </Link>
      </div>
    );
  }

  if (screen === "intro") {
    return (
      <div className="min-h-dvh bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-3/5 h-3/5 rounded-full bg-violet-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-2/5 h-2/5 rounded-full bg-fuchsia-500/10 blur-[80px] pointer-events-none" />

        {/* Back link */}
        <Link
          href="/m"
          className="absolute top-6 left-6 z-20 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="size-3.5" /> Back to TrainHub
        </Link>

        <div className="max-w-md w-full z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 mb-1 shadow-sm">
              <Sparkles className="h-7 w-7 text-fuchsia-500" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="text-sm text-slate-500 font-light leading-relaxed max-w-xs mx-auto">
                {quiz.description}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs">
                <Clock className="h-3.5 w-3.5 text-violet-500" />
                {quiz.timeLimitMins} mins
              </span>
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs">
                <HelpCircle className="h-3.5 w-3.5 text-fuchsia-500" />
                {questions.length} questions
              </span>
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs">
                <Award className="h-3.5 w-3.5 text-amber-500" />
                {quiz.passingScore}% to pass
              </span>
            </div>
          </div>

          <button
            onClick={() => setScreen("quiz")}
            className="w-full bg-slate-900 text-white hover:bg-slate-800 font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-lg"
          >
            Start Assessment <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  if (screen === "quiz") {
    const q = questions[currentQuestionIndex];
    const progress = (currentQuestionIndex / questions.length) * 100;
    const isAnswered = !!answers[q.id];

    return (
      <div className="min-h-dvh bg-slate-50 text-slate-800 flex flex-col relative overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-200">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full p-4 sm:p-6 z-10 animate-in fade-in duration-500">
          <div className="mb-8 pt-6">
            <p className="text-violet-600 font-mono text-xs font-semibold mb-3 tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <h2 className="text-xl font-semibold leading-relaxed text-slate-900">
              {q.text}
            </h2>
          </div>

          <div className="space-y-3 mt-auto mb-10">
            {q.type === "MCQ" || q.type === "TRUE_FALSE"
              ? JSON.parse(q.options || "[]").map(
                  (opt: string, idx: number) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <label
                        key={idx}
                        className={`group flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                          selected
                            ? "bg-violet-50/50 border-violet-500 shadow-sm transform scale-[1.01]"
                            : "bg-white border-slate-200/80 hover:bg-slate-50/60 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${
                            selected
                              ? "border-violet-600 bg-violet-100"
                              : "border-slate-300 group-hover:border-slate-400"
                          }`}
                        >
                          {selected && (
                            <div className="w-2 h-2 bg-violet-600 rounded-full" />
                          )}
                        </div>
                        <input
                          type="radio"
                          className="hidden"
                          name={q.id}
                          value={opt}
                          checked={selected}
                          onChange={(e) =>
                            setAnswers({ ...answers, [q.id]: e.target.value })
                          }
                        />
                        <span
                          className={`text-sm transition-colors ${
                            selected
                              ? "text-slate-950 font-medium"
                              : "text-slate-600 group-hover:text-slate-800"
                          }`}
                        >
                          {opt}
                        </span>
                      </label>
                    );
                  },
                )
              : (
                  <div className="relative group animate-in fade-in slide-in-from-bottom-4">
                    <textarea
                      value={answers[q.id] || ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [q.id]: e.target.value })
                      }
                      placeholder="Type your answer here..."
                      rows={5}
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none shadow-xs"
                    />
                  </div>
                )}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-slate-200/80 mt-auto">
            <div className="text-slate-400 text-xs font-medium">
              {currentQuestionIndex + 1} / {questions.length}
            </div>
            <button
              onClick={handleNext}
              disabled={!isAnswered || isSubmitting}
              className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-semibold py-3.5 px-6 rounded-xl flex items-center gap-2 transition-all transform active:scale-[0.98] shadow-md text-sm"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" /> Processing
                </>
              ) : currentQuestionIndex === questions.length - 1 ? (
                "Submit Assessment"
              ) : (
                <>
                  Next Question <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const passedFromState = passed;
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className={`absolute inset-0 opacity-40 pointer-events-none ${
          passedFromState
            ? "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-50 to-slate-50"
            : "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-100/50 via-slate-50 to-slate-50"
        }`}
      />

      <div className="max-w-sm w-full z-10 bg-white/90 backdrop-blur-2xl border border-slate-200/60 rounded-[2rem] p-8 text-center shadow-xl animate-in zoom-in-95 duration-700 slide-in-from-bottom-10">
        <div
          className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 relative ${
            passedFromState ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
          }`}
        >
          <div
            className={`absolute inset-0 rounded-full blur-xl opacity-40 ${
              passedFromState ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          {passedFromState ? (
            <Award className="h-12 w-12 relative z-10" />
          ) : (
            <Clock className="h-12 w-12 relative z-10" />
          )}
        </div>

        <h1 className="text-2xl font-extrabold mb-3 tracking-tight text-slate-900">
          {passedFromState ? "Brilliant Work!" : "Assessment Complete"}
        </h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed font-light">
          {passedFromState
            ? "You've successfully mastered this material and passed the assessment."
            : "You've finished the assessment. Review the material and try again!"}
        </p>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-xs">
          <div
            className={`absolute top-0 left-0 w-full h-1 ${
              passedFromState ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1 font-mono">
            Attempt #{attemptNumber}
          </div>
          <div
            className={`text-5xl font-black tracking-tighter ${
              passedFromState ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {score}
            <span className="text-2xl opacity-50">%</span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200/60 flex justify-between items-center text-xs">
            <span className="text-slate-500">Passing requirement</span>
            <span className="text-slate-800 font-medium bg-slate-200/60 px-2 py-1 rounded-full">
              {quiz.passingScore}%
            </span>
          </div>
        </div>

        <div className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-medium shadow-xs mb-6">
          {passedFromState ? (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Passing Grade Achieved
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-600">
              Did not meet passing score
            </span>
          )}
        </div>

        {/* Previous attempts history */}
        {previousAttempts.length > 0 && (
          <div className="mb-6 text-left">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Previous Attempts</h3>
            <div className="space-y-1.5">
              {previousAttempts.map((a) => (
                <div key={a.attemptNumber} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs">
                  <span className="text-slate-600 font-medium">Attempt #{a.attemptNumber}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${a.passed ? 'text-emerald-600' : 'text-amber-600'}`}>{a.score}%</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${a.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {a.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {!passedFromState && (
            <button
              onClick={handleRetry}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-md text-sm cursor-pointer"
            >
              Retry Assessment
            </button>
          )}
          {bookingId && (
            <a
              href={`/participant/class/${bookingId}`}
              className="w-full bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-xs text-sm cursor-pointer"
            >
              {passedFromState
                ? "Back to Course Modules"
                : "Back to Modules to Review"}
            </a>
          )}
          <Link
            href="/m"
            className="text-xs text-slate-400 hover:text-slate-600 py-2"
          >
            Back to TrainHub
          </Link>
        </div>
      </div>
    </div>
  );
}
