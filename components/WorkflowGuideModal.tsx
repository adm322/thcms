"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { CheckCircle2, Circle, ArrowRight, Building2, UserCheck, FileCheck, Send, ClipboardCheck, Banknote } from "lucide-react";

interface Step {
  id: string;
  label: string;
  who: string;
  whoIcon: string;
  description: string;
}

const ALL_STEPS: Step[] = [
  { id: "submitted", label: "Request Submitted", who: "HR", whoIcon: "🏢", description: "HR submits the training request with program details, costs, and HRDF estimate" },
  { id: "reviewing", label: "Admin Review", who: "Admin", whoIcon: "🔍", description: "Admin reviews the request, checks trainer availability, and approves or rejects" },
  { id: "approved", label: "Proposal & Invoice Sent", who: "Admin", whoIcon: "📄", description: "Admin sends official training proposal, invoice, and HRDF claim documents" },
  { id: "hrdf_employer", label: "Employer Submits to HRDF", who: "HR", whoIcon: "🏢", description: "Employer submits the grant application via e-TRiS portal with supporting documents from trainer" },
  { id: "hrdf_trainer", label: "Trainer Submits to HRDF", who: "Trainer", whoIcon: "👨‍🏫", description: "Trainer submits claim directly to HRDF (for SBL-Khas scheme) or provides documents to employer" },
  { id: "completed", label: "Completed", who: "Both", whoIcon: "🎉", description: "Training completed, HRDF claim processed. Evaluation and feedback collected" },
];

function getStepsForRole(role: "HR" | "ADMIN", status: string, employerSubmitted: boolean, trainerSubmitted: boolean): { steps: Step[]; currentStep: number } {
  // HR view focuses on HR actions
  if (role === "HR") {
    const hrSteps: Step[] = [
      ALL_STEPS[0], // submitted
      ALL_STEPS[1], // reviewing
      ALL_STEPS[2], // approved
      ALL_STEPS[3], // hrdf_employer
      ALL_STEPS[4], // hrdf_trainer
      ALL_STEPS[5], // completed
    ];
    let current = 0;
    if (status === "REVIEWING") current = 1;
    else if (status === "APPROVED") current = employerSubmitted ? 3 : 2;
    else if (status === "COMPLETED") current = 5;
    else if (status === "REJECTED") current = -1;
    return { steps: hrSteps, currentStep: current };
  }

  // Admin view focuses on admin actions
  const adminSteps: Step[] = [
    ALL_STEPS[0], // submitted
    ALL_STEPS[1], // reviewing
    ALL_STEPS[2], // approved
    ALL_STEPS[3], // hrdf_employer
    ALL_STEPS[4], // hrdf_trainer
    ALL_STEPS[5], // completed
  ];
  let current = 0;
  if (status === "REVIEWING") current = 1;
  else if (status === "APPROVED") current = 2;
  else if (status === "COMPLETED") current = 5;
  else if (status === "REJECTED") current = -1;
  return { steps: adminSteps, currentStep: current };
}

interface WorkflowGuideModalProps {
  open: boolean;
  onClose: () => void;
  role: "HR" | "ADMIN";
  status: string;
  employerHrdfSubmitted: boolean;
  trainerHrdfSubmitted: boolean;
  requestType?: string; // "Team Building" or "Training Program"
}

export function WorkflowGuideModal({ open, onClose, role, status, employerHrdfSubmitted, trainerHrdfSubmitted, requestType = "Request" }: WorkflowGuideModalProps) {
  const { steps, currentStep } = getStepsForRole(role, status, employerHrdfSubmitted, trainerHrdfSubmitted);

  const isRejected = status === "REJECTED";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🗺️</span>
            <DialogTitle className="text-lg">Your {requestType} Workflow</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Step-by-step guide — see what's done and what you need to do next
          </p>
        </DialogHeader>

        {isRejected ? (
          <div className="py-8 text-center space-y-3">
            <span className="text-4xl">❌</span>
            <h4 className="font-semibold text-lg">Request Rejected</h4>
            <p className="text-sm text-muted-foreground">This request has been rejected. Check admin notes for the reason, or submit a new request.</p>
          </div>
        ) : (
          <div className="space-y-1 py-4">
            {steps.map((step, i) => {
              const isDone = i < currentStep;
              const isCurrent = i === currentStep;
              const isFuture = i > currentStep;

              return (
                <div key={step.id} className="relative">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className={`absolute left-[19px] top-12 bottom-0 w-0.5 ${isDone ? "bg-primary" : "bg-muted"}`} />
                  )}

                  <div className={`flex gap-4 p-3 rounded-xl ${isCurrent ? "bg-primary/5 border border-primary/30" : ""}`}>
                    {/* Step circle */}
                    <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      isDone ? "bg-primary text-primary-foreground" :
                      isCurrent ? "bg-primary/20 text-primary ring-2 ring-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {isDone ? <CheckCircle2 className="h-5 w-5"/> : isCurrent ? i + 1 : i + 1}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className={`font-semibold text-sm ${isFuture ? "text-muted-foreground" : ""}`}>
                          {step.label}
                        </h5>
                        <Badge variant="outline" className={`text-[10px] ${isFuture ? "opacity-50" : ""}`}>
                          {step.whoIcon} {step.who}
                        </Badge>
                        {isCurrent && (
                          <Badge variant="default" className="text-[10px] animate-pulse">Now</Badge>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${isFuture ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                        {step.description}
                      </p>

                      {/* Current step — action hint */}
                      {isCurrent && (
                        <div className="mt-2 p-2 rounded-lg bg-primary/10 text-xs text-primary font-medium">
                          {getActionHint(step.id, role)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Separator />

        {/* Summary footer */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-primary"/>
            <span>Completed steps</span>
            <span className="flex h-3 w-3 rounded-full bg-primary/20 ring-2 ring-primary"/>
            <span>Current step</span>
            <span className="flex h-3 w-3 rounded-full bg-muted"/>
            <span>Upcoming</span>
          </div>
        </div>

        <Button variant="outline" onClick={onClose} className="w-full">Close Guide</Button>
      </DialogContent>
    </Dialog>
  );
}

function getActionHint(stepId: string, role: string): string {
  const hints: Record<string, string> = {
    submitted: role === "ADMIN" ? "👆 Click on this request to expand, then click 'Mark as Reviewing' to begin" : "⏳ Your request is with the admin. They will review it soon.",
    reviewing: role === "ADMIN" ? "👆 Review the details, add notes, then click 'Approve & Send Proposal' or 'Reject'" : "🔍 Admin is reviewing your request. They'll send a proposal when approved.",
    approved: role === "ADMIN" ? "👆 Use the HRDF tracking section to mark employer/trainer submissions. Upload supporting documents." : "✅ Your request is approved! Now submit your HRDF claim via e-TRiS. Upload supporting documents from the trainer.",
    hrdf_employer: "🏢 As the employer, submit the grant application on e-TRiS with the trainer's invoice, attendance sheet, and evaluation form.",
    hrdf_trainer: "👨‍🏫 As the trainer, provide supporting documents (invoice, attendance, evaluation) to the employer for their claim submission.",
    completed: "🎉 All done! The training is complete and HRDF claim has been processed.",
  };
  return hints[stepId] || "";
}
