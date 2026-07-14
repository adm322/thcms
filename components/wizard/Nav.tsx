"use client";

import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sticky bottom navigation for a wizard: a Back button on the left and a
 * primary action (Continue *or* Submit) on the right.
 *
 * All colors use `--brand` / `--brand-deep` CSS vars already on the parent root,
 * so every role's wizard gets the same brand without prop wiring.
 *
 * Usage:
 *   <WizardNav
 *     step={step} totalSteps={3} busy={busy}
 *     onBack={() => setStep(s => s - 1)}
 *     onContinue={() => setStep(s => s + 1)}
 *     onSubmit={submit}
 *   />
 */
export function WizardNav({
  step,
  totalSteps,
  busy,
  continueLabel = "Continue",
  submitLabel,
  onBack,
  onContinue,
  onSubmit,
}: {
  step:          number;
  totalSteps:    number;
  busy:          boolean;
  continueLabel?: string;
  submitLabel?:   string;
  onBack:        () => void;
  onContinue:    () => void;
  onSubmit:      () => void;
}) {
  const isFinal = step >= totalSteps - 1;

  return (
    <div className="flex gap-2">
      {step > 0 ? (
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3.5 text-sm font-bold bg-card border border-border text-foreground active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
      ) : (
        <span className="flex-1" aria-hidden />
      )}

      {isFinal ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy}
          className={cn(
            "flex-[2] inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3.5 text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-transform disabled:opacity-60",
            "bg-[image:var(--brand-gradient)]",
          )}
          style={{
            backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))",
            boxShadow: "0 14px 30px -10px var(--brand-deep)55",
          }}
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? "Submitting…" : (submitLabel ?? "Submit")}
          {!busy && <Check className="size-4" />}
        </button>
      ) : (
        <button
          type="button"
          onClick={onContinue}
          disabled={busy}
          className="flex-[2] inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3.5 text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-transform disabled:opacity-60"
          style={{
            backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))",
            boxShadow: "0 14px 30px -10px var(--brand-deep)55",
          }}
        >
          {continueLabel}
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}
