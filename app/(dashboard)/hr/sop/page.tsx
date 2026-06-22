"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, AlertTriangle, FileText, Users, Building2, GraduationCap, ClipboardCheck, ArrowRight } from "lucide-react";

export default function SOPGuide() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Malaysian Training SOP & HRDF Guide</h1>
        <p className="text-muted-foreground mt-1">Standard Operating Procedures for HR, Training Administrators, and Vendors — based on HRD Corp guidelines</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hr">HR / Employer SOP</TabsTrigger>
          <TabsTrigger value="admin">Training Admin SOP</TabsTrigger>
          <TabsTrigger value="vendor">Vendor SOP</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">🗺️ Complete Training Lifecycle</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                {[
                  { phase: "1. Plan", who: "HR", icon: "📋", tasks: "Needs analysis, budget approval, vendor selection", days: "4–6 weeks before" },
                  { phase: "2. Apply Grant", who: "HR", icon: "🏛️", tasks: "Submit e-TRiS grant application, upload docs", days: "1–7 days before training" },
                  { phase: "3. Execute", who: "Admin", icon: "🎯", tasks: "Venue, attendance, materials, evaluation", days: "Training day(s)" },
                  { phase: "4. Claim", who: "HR + Vendor", icon: "💰", tasks: "Submit claim with docs, wait reimbursement", days: "Within 6 months" },
                ].map(s => (
                  <div key={s.phase} className="rounded-xl border p-4 space-y-2">
                    <Badge variant="outline" className="text-xs">{s.who}</Badge>
                    <p className="font-semibold text-sm">{s.phase}</p>
                    <p className="text-xs text-muted-foreground">{s.tasks}</p>
                    <p className="text-[10px] text-muted-foreground italic">{s.days}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">🏛️ HRDF Claim Process (e-TRiS)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { num: 1, title: "Register as HRD Corp Employer", desc: "Companies with 10+ Malaysian employees must register. Submit SSM Form 9, EPF & SOCSO statements via e-TRiS portal.", docs: "SSM Form 9, EPF statement, SOCSO statement, company profile" },
                  { num: 2, title: "Select Claimable Training Program", desc: "Choose from HRD Corp-registered training provider. Collect course brochure, trainer profile, and formal quotation.", docs: "Course brochure, trainer CV, quotation" },
                  { num: 3, title: "Submit Grant Application (Before Training)", desc: "Apply via e-TRiS → Application → Training Grant → Apply Grant. Submit at least 1-7 days before training date. Approval takes 10-14 working days.", docs: "Training proposal, course outline, trainer profile, course schedule" },
                  { num: 4, title: "Conduct Training & Document Everything", desc: "Run training. Collect signed attendance sheets (Form T3), photos/videos, certificates, and evaluation forms.", docs: "Attendance sheets (T3), photos, certificates, evaluation forms" },
                  { num: 5, title: "Submit Reimbursement Claim (After Training)", desc: "e-TRiS → Application → Claim → Submit Claims with Grants. Upload invoice, attendance, photos, trainer profile. Deadline: within 6 months.", docs: "Claim form, official invoice, signed attendance records, training photos, trainer profile, certificates" },
                  { num: 6, title: "Wait for Reimbursement", desc: "HRD Corp reviews and verifies documents. Processing time: 14-30 working days. Payment credited to registered bank account.", docs: null },
                ].map(s => (
                  <div key={s.num} className="flex gap-4 p-4 rounded-xl border">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">{s.num}</div>
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{s.title}</p>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                      {s.docs && <p className="text-xs text-primary mt-1">📎 Required: {s.docs}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HR SOP */}
        <TabsContent value="hr" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">🏢 HR / Employer Responsibilities</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <PhaseSection title="Pre-Training (4–6 weeks before)" color="bg-blue-50 border-blue-200">
                <CheckItem>Conduct Training Needs Analysis (TNA) — identify skill gaps</CheckItem>
                <CheckItem>Define learning objectives aligned with KPIs</CheckItem>
                <CheckItem>Secure budget & management approval</CheckItem>
                <CheckItem>Select training method (onsite/online/hybrid)</CheckItem>
                <CheckItem>Source & confirm trainer/vendor — check HRDF registration</CheckItem>
                <CheckItem>Apply for HRDF grant via e-TRiS (1–7 days before training)</CheckItem>
                <CheckItem>Upload: training proposal, course outline, trainer profile, schedule</CheckItem>
              </PhaseSection>
              <PhaseSection title="Post-Training (After completion)" color="bg-emerald-50 border-emerald-200">
                <CheckItem>Collect all documentation from training administrator</CheckItem>
                <CheckItem>Submit reimbursement claim via e-TRiS (within 6 months)</CheckItem>
                <CheckItem>Upload: claim form, invoice, attendance, photos, certificates</CheckItem>
                <CheckItem>Track claim status on e-TRiS portal</CheckItem>
                <CheckItem>Update internal training database with completion records</CheckItem>
              </PhaseSection>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRAINING ADMIN SOP */}
        <TabsContent value="admin" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">📋 Training Administrator Checklist</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <PhaseSection title="Pre-Training Preparation" color="bg-blue-50 border-blue-200">
                <CheckItem>Book venue, catering & AV equipment (2–3 weeks before)</CheckItem>
                <CheckItem>Prepare materials: manuals, handouts, slides, stationery, name tags</CheckItem>
                <CheckItem>Send joining instructions to participants (2 weeks before)</CheckItem>
                <CheckItem>Arrange travel & accommodation if outstation (1–2 weeks before)</CheckItem>
                <CheckItem>Draft detailed program schedule with timings</CheckItem>
                <CheckItem>Dry-run with trainer; test AV equipment (1 day before)</CheckItem>
              </PhaseSection>
              <PhaseSection title="During Training" color="bg-amber-50 border-amber-200">
                <CheckItem>Registration desk: distribute IDs, manuals, supplies</CheckItem>
                <CheckItem>Take daily attendance — Form T3 signed by each participant</CheckItem>
                <CheckItem>Take photos/videos of training in session</CheckItem>
                <CheckItem>Facilitate sessions, manage timekeeping</CheckItem>
                <CheckItem>Administer pre-test/post-test assessments</CheckItem>
                <CheckItem>Distribute & collect evaluation/feedback forms</CheckItem>
                <CheckItem>Closing ceremony: certificates of completion</CheckItem>
                <CheckItem>Settle trainer honorarium & venue/caterer payments</CheckItem>
              </PhaseSection>
              <PhaseSection title="Post-Training Documentation (3–5 working days)" color="bg-emerald-50 border-emerald-200">
                <CheckItem>Compile Training Completion Report</CheckItem>
                <CheckItem>Submit report to HR, management & regulatory bodies</CheckItem>
                <CheckItem>Liquidate accounts: submit receipts & adjustment vouchers</CheckItem>
                <CheckItem>Update training database with participant records</CheckItem>
                <CheckItem>File soft copy (PDF) + hard copy records</CheckItem>
                <CheckItem>Follow-up survey (30-60-90 days) to assess on-job application</CheckItem>
              </PhaseSection>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VENDOR SOP */}
        <TabsContent value="vendor" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">👨‍🏫 Training Provider / Vendor SOP</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <PhaseSection title="Registration & Accreditation" color="bg-blue-50 border-blue-200">
                <CheckItem>Register as HRD Corp training provider via e-TRiS</CheckItem>
                <CheckItem>Register all training programmes before marketing as claimable</CheckItem>
                <CheckItem>Ensure trainers are HRD Corp-accredited with updated e-TRiS profiles</CheckItem>
                <CheckItem>Submit: course title, objectives, methodology, learning outcomes, module breakdown</CheckItem>
                <CheckItem>For licensed materials: obtain pre-approval before training (valid 2 years)</CheckItem>
              </PhaseSection>
              <PhaseSection title="Document Submission for Employer Claim" color="bg-amber-50 border-amber-200">
                <CheckItem>Provide formal quotation with course fee breakdown</CheckItem>
                <CheckItem>Submit trainer profile/CV to employer</CheckItem>
                <CheckItem>Issue official invoice addressed to employer (or HRD Corp for SBL-Khas)</CheckItem>
                <CheckItem>Provide daily attendance forms (T3) signed by each trainee</CheckItem>
                <CheckItem>Submit Form JD-14 declaration signed by manager or above</CheckItem>
                <CheckItem>Complete HRD-TEE Output Assessment within 21 working days</CheckItem>
                <CheckItem>Retain all hard copies for minimum 5 years</CheckItem>
              </PhaseSection>
              <PhaseSection title="Common Mistakes to Avoid" color="bg-red-50 border-red-200">
                <div className="space-y-2">
                  {[
                    "Missing pre-approval before training → claim rejected",
                    "Submitting claim >6 months after course → automatically rejected",
                    "Trainer not accredited → claim queried",
                    "Incomplete invoice (must include TP name, employer name, programme title, date, amount)",
                    "Attendance not signed daily by each trainee → claim queried",
                    "Trainee names differ between grant application and claim → delay",
                  ].map((m, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5"/>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </PhaseSection>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PhaseSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <h4 className="font-semibold text-sm mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5"/>
      <span>{children}</span>
    </div>
  );
}
