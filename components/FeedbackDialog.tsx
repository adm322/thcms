"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogFooter, 
  DialogTitle, 
  DialogDescription, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  question: string;
  type: string;
  maxRating: number;
}

interface FeedbackDialogProps {
  evaluationId: string;
  evaluationTitle: string;
  questionsJson: string;
}

export default function FeedbackDialog({
  evaluationId,
  evaluationTitle,
  questionsJson,
}: FeedbackDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse questions
  const questions: Question[] = JSON.parse(questionsJson || "[]");

  // State to hold user answers: { [questionIdx]: { rating: number, comment: string } }
  const [answers, setAnswers] = useState<Record<number, { rating: number; comment: string }>>(() => {
    const initial: Record<number, { rating: number; comment: string }> = {};
    questions.forEach((q, idx) => {
      initial[idx] = { rating: 0, comment: "" };
    });
    return initial;
  });

  const handleRatingChange = (questionIdx: number, rating: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIdx]: {
        ...prev[questionIdx],
        rating,
      },
    }));
  };

  const handleCommentChange = (questionIdx: number, comment: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIdx]: {
        ...prev[questionIdx],
        comment,
      },
    }));
  };

  const handleSubmit = async () => {
    // Basic validation
    const hasUnansweredRating = questions.some((q, idx) => q.type === "RATING" && (!answers[idx] || answers[idx].rating === 0));

    if (hasUnansweredRating) {
      setError("Please provide a rating for all rating questions.");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Format body
    const formattedAnswers = Object.entries(answers).map(([key, val]) => ({
      questionIdx: Number(key),
      rating: val.rating,
      comment: val.comment,
    }));

    try {
      const res = await fetch(`/api/participants/evaluations/${evaluationId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback.");
      }

      setSuccess(true);
      router.refresh();
      
      // Auto-close dialog after 2 seconds
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        // Reset answers
        const reset: Record<number, { rating: number; comment: string }> = {};
        questions.forEach((_, idx) => {
          reset[idx] = { rating: 0, comment: "" };
        });
        setAnswers(reset);
      }, 2000);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs font-medium transition-all duration-200"
            size="sm"
          >
            Share Feedback
          </Button>
        }
      />
      
      <DialogContent className="sm:max-w-md bg-card rounded-lg p-6 shadow-sm border border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
            Course Evaluation
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-normal">
            {evaluationTitle}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-200">
            <div className="h-14 w-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100">
              <CheckCircle className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Feedback Submitted</h3>
            <p className="text-xs text-muted-foreground mt-1.5 font-normal">
              Thank you for helping us improve our training programs.
            </p>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-md text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-5">
              {questions.map((q, idx) => (
                <div key={idx} className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
                  <label className="text-sm font-medium text-foreground block">
                    {q.question}
                  </label>

                  {q.type === "RATING" ? (
                    <div className="flex items-center gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const isSelected = starValue <= (answers[idx]?.rating || 0);
                        return (
                          <button
                            key={starValue}
                            type="button"
                            onClick={() => handleRatingChange(idx, starValue)}
                            aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
                            title={`${starValue} star${starValue > 1 ? "s" : ""}`}
                            aria-pressed={isSelected}
                            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm focus-visible:ring-offset-1 transition-transform hover:scale-105 active:scale-95"
                          >
                            <Star 
                              className={cn(
                                "h-6 w-6 transition-colors",
                                isSelected 
                                  ? "fill-amber-400 text-amber-400" 
                                  : "text-slate-200 hover:text-amber-200"
                              )} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <Textarea
                      placeholder="Type your response here..."
                      value={answers[idx]?.comment || ""}
                      onChange={(e) => handleCommentChange(idx, e.target.value)}
                      className="min-h-[80px] rounded-md text-sm text-foreground border-input focus-visible:ring-ring bg-card mt-1"
                    />
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="pt-4 border-t border-border flex flex-row items-center justify-end gap-2">
              <DialogClose
                render={
                  <Button 
                    variant="outline" 
                    disabled={submitting}
                    className="rounded-full text-xs font-medium border-border"
                  >
                    Cancel
                  </Button>
                }
              />
              
              <Button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs font-medium min-w-32"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
