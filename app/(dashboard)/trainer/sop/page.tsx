"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle2, AlertTriangle, BookOpen, Calendar, Users,
  FileText, DollarSign, Star, Upload, Megaphone, ArrowRight,
} from "lucide-react";

export default function TrainerSOPPage() {
  return (
    <div className="space-y-6 max-w-5xl section-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trainer SOP & Guide</h1>
        <p className="text-muted-foreground mt-1">
          Everything you need to know as a training provider on TrainHub — from program creation to getting paid
        </p>
      </div>

      <Tabs defaultValue="trainhub">
        <TabsList>
          <TabsTrigger value="trainhub">Using TrainHub</TabsTrigger>
          <TabsTrigger value="programs">Programs & Bookings</TabsTrigger>
          <TabsTrigger value="documents">HRDF Documents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* ─── USING TRAINHUB ─── */}
        <TabsContent value="trainhub" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />Getting Started as a Trainer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <PhaseSection title="Your Dashboard" color="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CheckItem>Dashboard shows your key metrics: programs, bookings, rating, revenue</CheckItem>
                <CheckItem>Actions panel highlights what needs your attention (upcoming sessions, pending docs)</CheckItem>
                <CheckItem>Availability calendar lets HR see when you're free — keep it updated</CheckItem>
                <CheckItem>Code of Conduct card in the sidebar — click to read the full document</CheckItem>
              </PhaseSection>

              <PhaseSection title="Quick Reference" color="bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800">
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: "Create Program", desc: "Build your course listing with modules, pricing, and schedule", link: "/trainer/programs/new" },
                    { label: "My Programs", desc: "View, edit, clone, or unpublish your programs", link: "/trainer/programs" },
                    { label: "Availability", desc: "Mark days as available/unavailable — HR books based on this", link: "/trainer" },
                    { label: "Earnings", desc: "Track revenue across all completed trainings", link: "/trainer/earnings" },
                    { label: "Quizzes & Polls", desc: "Create standalone quizzes or polls for participants", link: "/trainer/quizzes" },
                    { label: "Messages", desc: "Communicate with HR and admin directly", link: "/trainer/messages" },
                  ].map(item => (
                    <a key={item.label} href={item.link}
                      className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors no-underline"
                    >
                      <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </PhaseSection>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── PROGRAMS & BOOKINGS ─── */}
        <TabsContent value="programs" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4" />Program Lifecycle</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { phase: "1. Create", icon: "📝", desc: "Fill in program details: title, category, description, modules, pricing, duration. Upload a thumbnail to stand out.", badge: "DRAFT" },
                  { phase: "2. Publish", icon: "🚀", desc: "Once ready, publish your program. Admin reviews and features quality programs. It becomes visible in the HR marketplace.", badge: "PUBLISHED" },
                  { phase: "3. Get Booked", icon: "📅", desc: "HR browses and books your program. You'll see new bookings on your dashboard. Keep availability updated.", badge: "CONFIRMED" },
                ].map(s => (
                  <div key={s.phase} className="rounded-xl border p-4 space-y-2">
                    <Badge variant="outline" className="text-[10px]">{s.badge}</Badge>
                    <p className="font-semibold text-sm">{s.phase}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>

              <PhaseSection title="Program Best Practices" color="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                <CheckItem>Write clear learning objectives — HR needs to justify training budgets</CheckItem>
                <CheckItem>Break content into modules with estimated hours each</CheckItem>
                <CheckItem>Set competitive pricing — check the marketplace for similar programs</CheckItem>
                <CheckItem>Upload a professional thumbnail (16:9 ratio recommended)</CheckItem>
                <CheckItem>Specify if online or onsite — include venue requirements for onsite</CheckItem>
                <CheckItem>Keep your availability calendar accurate to avoid double-bookings</CheckItem>
              </PhaseSection>

              <PhaseSection title="Handling Bookings" color="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <CheckItem>New bookings appear as PENDING → admin approves → becomes CONFIRMED</CheckItem>
                <CheckItem>View booking details: date, company, participants, venue, special requests</CheckItem>
                <CheckItem>Upload materials and pre-work for participants before the session</CheckItem>
                <CheckItem>After training, complete the evaluation and upload attendance</CheckItem>
                <CheckItem>Use the QR check-in feature for attendance tracking on training day</CheckItem>
              </PhaseSection>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── HRDF DOCUMENTS ─── */}
        <TabsContent value="documents" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" />Documents You Must Provide</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                For every completed training, the employer needs these documents from you to submit their HRDF claim.
                Upload them via the booking detail page.
              </p>

              <PhaseSection title="Required Documents Checklist" color="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CheckItem><strong>Official Invoice</strong> — addressed to the employer, with course title, date, amount, and your company details</CheckItem>
                <CheckItem><strong>Daily Attendance Sheets (Form T3)</strong> — signed by each participant every training day</CheckItem>
                <CheckItem><strong>Trainer Profile / CV</strong> — updated with HRD Corp accreditation details</CheckItem>
                <CheckItem><strong>Course Outline & Schedule</strong> — detailed breakdown of modules and timings</CheckItem>
                <CheckItem><strong>Training Photos</strong> — 3–5 photos showing training in session (wide angle, group, close-up)</CheckItem>
                <CheckItem><strong>Evaluation Summary</strong> — compiled feedback from participant evaluation forms</CheckItem>
                <CheckItem><strong>Certificates of Completion</strong> — issued to all participants who met attendance requirements</CheckItem>
              </PhaseSection>

              <PhaseSection title="HRDF Claim Timeline" color="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="space-y-3">
                  {[
                    { when: "Before training", action: "Employer submits grant application via e-TRiS (1–7 days before)" },
                    { when: "During training", action: "Collect signed attendance daily, take photos, administer evaluations" },
                    { when: "Within 7 days after", action: "Upload all supporting documents to TrainHub for the employer" },
                    { when: "Within 6 months", action: "Employer submits reimbursement claim to HRD Corp" },
                    { when: "14–30 working days", action: "HRD Corp reviews and processes payment to employer" },
                  ].map((t, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <Badge variant="outline" className="text-[10px] h-5 flex-shrink-0">{t.when}</Badge>
                      <span className="text-muted-foreground">{t.action}</span>
                    </div>
                  ))}
                </div>
              </PhaseSection>

              <PhaseSection title="Common Mistakes" color="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                <div className="space-y-2">
                  {[
                    "Missing trainer accreditation → claim rejected immediately",
                    "Attendance not signed daily by each participant → HRD Corp queries",
                    "Invoice missing key details (TP name, employer, course title, date, amount)",
                    "Trainee names differ between grant application and attendance sheet",
                    "Photos don't show training in session → claim verification fails",
                    "Documents submitted after 6-month deadline → automatically rejected",
                  ].map((m, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </PhaseSection>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── COMPLIANCE ─── */}
        <TabsContent value="compliance" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4" />Ratings, Reviews & Conduct</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <PhaseSection title="Evaluation & Ratings" color="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CheckItem>After each training, participants submit evaluations — these affect your average rating</CheckItem>
                <CheckItem>Ratings are visible to HR when browsing programs — higher ratings = more bookings</CheckItem>
                <CheckItem>Respond to feedback constructively — admin can feature highly-rated programs</CheckItem>
                <CheckItem>You can view all your evaluations under <strong>Evaluations</strong> in the sidebar</CheckItem>
              </PhaseSection>

              <PhaseSection title="Code of Conduct" color="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <CheckItem>Read the full Code of Conduct — click the amber card in your sidebar</CheckItem>
                <CheckItem>Maintain professional behavior: punctuality, appropriate attire, respectful communication</CheckItem>
                <CheckItem>Protect participant and company confidential information</CheckItem>
                <CheckItem>All training materials must be original or properly licensed</CheckItem>
                <CheckItem>No discrimination based on race, religion, gender, age, or disability</CheckItem>
                <CheckItem>Violations may result in program delisting or account suspension</CheckItem>
              </PhaseSection>

              <PhaseSection title="HRDF Compliance Requirements" color="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                <CheckItem>Register as HRD Corp training provider via e-TRiS portal</CheckItem>
                <CheckItem>Register all training programmes before marketing as HRDF-claimable</CheckItem>
                <CheckItem>Ensure your trainer profile is HRD Corp-accredited with updated e-TRiS profile</CheckItem>
                <CheckItem>Complete HRD-TEE Output Assessment within 21 working days post-training</CheckItem>
                <CheckItem>Retain all hard copies of training records for minimum 5 years</CheckItem>
                <CheckItem>For licensed/copyrighted materials: obtain pre-approval before use (valid 2 years)</CheckItem>
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
      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}
