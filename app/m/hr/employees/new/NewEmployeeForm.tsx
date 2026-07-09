"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Briefcase,
  Check, AlertCircle, UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { WizardStepper, WizardNav } from "@/components/wizard";

interface FormState {
  // Step 1 — Basics
  name:   string;
  email:  string;
  phone:  string;
  // Step 2 — Profile
  icNumber:        string;
  department:      string;
  position:        string;
  employmentType:  "PERMANENT" | "CONTRACT" | "PART_TIME" | "INTERN" | "PROBATION";
  dateJoined:      string;     // YYYY-MM-DD or empty
}

const STEPS = [
  { label: "Basics",  icon: UserPlus    },
  { label: "Profile", icon: Building2   },
  { label: "Review",  icon: Check       },
] as const;

const TYPE_LABEL: Record<FormState["employmentType"], string> = {
  PERMANENT:  "Permanent",
  CONTRACT:   "Contract",
  PART_TIME:  "Part-time",
  INTERN:     "Intern",
  PROBATION:  "Probation",
};

export function NewEmployeeForm() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name:           "",
    email:          "",
    phone:          "",
    icNumber:       "",
    department:     "",
    position:       "",
    employmentType: "PERMANENT",
    dateJoined:      "",
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const stepErrors = useMemo(() => ({
    0: form.name.trim().length < 2
      ? "Name must be at least 2 characters."
      : form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? "Email format is invalid."
      : null,
    1: null,
    2: null,
  } as const), [form]);

  function next() {
    if (stepErrors[step]) { setErr(stepErrors[step]); return; }
    setErr(null);
    setStep((s) => (Math.min(2, s + 1) as 0 | 1 | 2));
  }
  function back() {
    setErr(null);
    setStep((s) => (Math.max(0, s - 1) as 0 | 1 | 2));
  }

  async function submit() {
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        name:           form.name.trim(),
        employmentType: form.employmentType,
      };
      const email     = form.email.trim();      if (email)     payload.email      = email;
      const phone     = form.phone.trim();      if (phone)     payload.phone      = phone;
      const icNumber  = form.icNumber.trim();   if (icNumber)  payload.icNumber   = icNumber;
      const dept      = form.department.trim(); if (dept)      payload.department = dept;
      const pos       = form.position.trim();   if (pos)       payload.position   = pos;
      const joined    = form.dateJoined;        if (joined)     payload.dateJoined  = joined;

      const res = await fetch("/api/hr/employees", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? `Failed (${res.status})`);
        setBusy(false);
        return;
      }
      router.push("/m/hr/employees");
      router.refresh();
    } catch {
      setErr("Network error");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <WizardStepper steps={STEPS.map((s) => ({ label: s.label, icon: s.icon }))} current={step} />

      <div
        className="bg-card border border-border rounded-3xl shadow-sm p-5 min-h-[280px]"
        key={step}
      >
        {err && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive inline-flex items-start gap-2">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {step === 0 && <BasicsStep form={form} update={update} error={stepErrors[0]} />}
        {step === 1 && <ProfileStep form={form} update={update} />}
        {step === 2 && <ReviewStep form={form} />}
      </div>

      <WizardNav
        step={step}
        totalSteps={STEPS.length}
        busy={busy}
        submitLabel="Add to roster"
        onBack={back}
        onContinue={next}
        onSubmit={submit}
      />
    </div>
  );
}

/* ─── Steps ──────────────────────────────────────────────────────────────── */

function BasicsStep({
  form, update, error,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  error: string | null;
}) {
  return (
    <div className="space-y-5">
      <StepHeader
        step={0}
        title="Who's joining the team?"
        hint="Required: name. Email and phone are optional but recommended."
        icon={<UserPlus className="size-5" />}
      />

      <div>
        <Label>Full name</Label>
        <input
          autoFocus
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Aisha Rahman"
          className="w-full bg-background border border-border rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
      </div>

      <div>
        <Label hint="Optional. When set, the employee can receive training invites.">Email</Label>
        <input
          type="email"
          inputMode="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="aisha@company.my"
          className="w-full bg-background border border-border rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
      </div>

      <div>
        <Label hint="Optional">Phone</Label>
        <input
          type="tel"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+60 12-345 6789"
          className="w-full bg-background border border-border rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ProfileStep({
  form, update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const types: FormState["employmentType"][] = ["PERMANENT", "CONTRACT", "PART_TIME", "INTERN", "PROBATION"];
  return (
    <div className="space-y-5">
      <StepHeader
        step={1}
        title="Where do they fit?"
        hint="Department, role, and how they&apos;re employed."
        icon={<Building2 className="size-5" />}
      />

      <div>
        <Label hint="Optional">Department</Label>
        <input
          value={form.department}
          onChange={(e) => update("department", e.target.value)}
          placeholder="e.g. Engineering"
          className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
      </div>

      <div>
        <Label hint="Optional. Title / role">Position</Label>
        <input
          value={form.position}
          onChange={(e) => update("position", e.target.value)}
          placeholder="e.g. Senior Engineer"
          className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
      </div>

      <div>
        <Label hint="Optional. National ID / MyKad / passport">IC number</Label>
        <input
          value={form.icNumber}
          onChange={(e) => update("icNumber", e.target.value)}
          placeholder="e.g. 880101-14-5678"
          className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 tabular-nums"
        />
      </div>

      <div>
        <Label icon={<Briefcase className="size-3.5" />}>Employment type</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {types.map((t) => {
            const active = form.employmentType === t;
            return (
              <label
                key={t}
                className={cn(
                  "rounded-xl border py-2 text-center cursor-pointer transition-colors text-[11px] font-bold",
                  active
                    ? "bg-[var(--brand-soft)] border-[var(--brand)] text-[var(--brand-deep)]"
                    : "bg-background border-border text-muted-foreground",
                )}
              >
                <input
                  type="radio"
                  name="employmentType"
                  value={t}
                  checked={active}
                  onChange={() => update("employmentType", t)}
                  className="sr-only peer"
                />
                {TYPE_LABEL[t]}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <Label hint="Optional. Defaults to today on the server if empty.">Date joined</Label>
        <input
          type="date"
          value={form.dateJoined}
          onChange={(e) => update("dateJoined", e.target.value)}
          className="w-full bg-background border border-border rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
      </div>
    </div>
  );
}

function ReviewStep({ form }: { form: FormState }) {
  return (
    <div className="space-y-5">
      <StepHeader
        step={2}
        title="Confirm and add"
        hint="They&apos;ll show up on /m/hr/employees and in /admin/trainers&apos; targets."
        icon={<Check className="size-5" />}
      />
      <dl className="divide-y divide-border">
        <Row k="Name">{form.name}</Row>
        {form.email && <Row k="Email">{form.email}</Row>}
        {form.phone && <Row k="Phone">{form.phone}</Row>}
        {form.department && <Row k="Department">{form.department}</Row>}
        {form.position   && <Row k="Position">{form.position}</Row>}
        {form.icNumber   && <Row k="IC">{form.icNumber}</Row>}
        <Row k="Type">{TYPE_LABEL[form.employmentType]}</Row>
        {form.dateJoined && (
          <Row k="Date joined">
            {new Date(form.dateJoined).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </Row>
        )}
      </dl>
    </div>
  );
}

/* ─── Atoms ──────────────────────────────────────────────────────────────── */

function StepHeader({
  step, title, hint, icon,
}: { step: number; title: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="size-11 rounded-2xl grid place-items-center shrink-0"
        style={{ backgroundColor: "var(--brand-soft)", color: "var(--brand-deep)" }}
      >
        {icon}
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-[0.08em] font-bold" style={{ color: "var(--brand-deep)" }}>
          Step {step + 1} of 3
        </div>
        <h2 className="text-lg font-extrabold tracking-tight leading-tight mt-0.5">{title}</h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{hint}</p>
      </div>
    </div>
  );
}

function Label({ children, htmlFor, icon, hint }: { children: React.ReactNode; htmlFor?: string; icon?: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="block mb-2">
      <div className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground inline-flex items-center gap-1.5">
        {icon}{children}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground/80 font-normal mt-0.5 normal-case tracking-normal">{hint}</div>}
    </label>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="py-3 grid grid-cols-[110px_1fr] gap-3 items-start">
      <dt className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground pt-0.5">{k}</dt>
      <dd className="text-sm leading-snug">{children}</dd>
    </div>
  );
}

