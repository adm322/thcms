"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Star, UserPlus, Mail,
  Check, AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { WizardStepper, WizardNav } from "@/components/wizard";

interface FormState {
  name:        string;
  email:       string;
  expertise:   string;
  hourlyRate:  number;
  bio:         string;
}

const STEPS = [
  { label: "Contact", icon: UserPlus },
  { label: "Profile", icon: Star     },
  { label: "Confirm", icon: Check    },
] as const;

export function InviteTrainerForm() {
  const router = useRouter();
    const [step, setStep] = useState<0 | 1 | 2>(0);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; email: string; tempPassword: string } | null>(null);

  const [form, setForm] = useState<FormState>({
    name:        "",
    email:       "",
    expertise:   "",
    hourlyRate:  350,
    bio:         "",
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const stepErrors = useMemo(() => ({
    0: form.name.trim().length < 2
      ? "Name must be at least 2 characters."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? "Enter a valid email."
      : null,
    1: form.hourlyRate < 0
      ? "Hourly rate cannot be negative."
      : null,
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
      const res = await fetch("/api/admin/trainers/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        form.name,
          email:       form.email,
          expertise:   form.expertise,
          hourlyRate:  form.hourlyRate,
          bio:         form.bio,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? `Failed (${res.status})`);
        setBusy(false);
        return;
      }
      setDone({ name: data.name ?? form.name, email: data.email ?? form.email, tempPassword: data.tempPassword });
      setBusy(false);
    } catch {
      setErr("Network error");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-5">
        <div className="bg-card border border-border rounded-3xl shadow-sm p-5 text-center">
          <div
            className="size-14 rounded-2xl mx-auto grid place-items-center mb-3"
            style={{ backgroundColor: "var(--brand-soft)", color: "var(--brand-deep)" }}
          >
            <Check className="size-7" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Invite ready</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {done.name} can now log in. Share the password below privately.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">Name</div>
              <div className="text-sm font-bold">{done.name}</div>
            </div>
          </div>
          <div className="my-3 border-t border-border" />
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">Email</div>
              <div className="text-sm font-bold truncate">{done.email}</div>
            </div>
          </div>
          <div className="my-3 border-t border-border" />
          <div className="flex items-center gap-2">
            <Star className="size-4 shrink-0" style={{ color: "var(--brand-deep)" }} />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">Temporary password</div>
              <div className="text-base font-mono font-bold tabular-nums select-all mt-1 p-2 rounded-md" style={{ backgroundColor: "var(--brand-soft)", color: "var(--brand-deep)" }}>
                {done.tempPassword}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">Tap to select — share via secure channel.</div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            router.push("/m/admin/trainers");
            router.refresh();
          }}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-transform"
          style={{
            backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))",
            boxShadow: "0 14px 30px -10px var(--brand-deep)55",
          }}
        >
          Back to trainers
        </button>
      </div>
    );
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

        {step === 0 && <ContactStep form={form} update={update} error={stepErrors[0]} />}
        {step === 1 && <ProfileStep form={form} update={update} error={stepErrors[1]} />}
        {step === 2 && <ConfirmStep form={form} />}
      </div>

      <WizardNav
        step={step}
        totalSteps={STEPS.length}
        busy={busy}
        submitLabel="Send invite"
        onBack={back}
        onContinue={next}
        onSubmit={submit}
      />
    </div>
  );
}

/* ─── Steps ──────────────────────────────────────────────────────────────── */

function ContactStep({
  form, update, error,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  error: string | null;
}) {
  return (
    <div className="space-y-5">
      <StepHeader step={0} title="Who&apos;s joining?" hint="The basics for the invite." icon={<UserPlus className="size-5" />} />
      <div>
        <Label>Full name</Label>
        <input
          autoFocus
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Hafiz Rahman"
          className="w-full bg-background border border-border rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
      </div>
      <div>
        <Label>Email</Label>
        <input
          type="email"
          inputMode="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="hafiz@example.my"
          className="w-full bg-background border border-border rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
        <div className="text-[11px] text-muted-foreground mt-1">Becomes their login.</div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ProfileStep({
  form, update, error,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  error: string | null;
}) {
  return (
    <div className="space-y-5">
      <StepHeader step={1} title="Their expertise" hint="What they teach and their hourly rate." icon={<Star className="size-5" />} />
      <div>
        <Label>Expertise tags</Label>
        <input
          value={form.expertise}
          onChange={(e) => update("expertise", e.target.value)}
          placeholder="Leadership, Communication"
          className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
        <div className="text-[11px] text-muted-foreground mt-1">Comma-separated. Defaults to none.</div>
      </div>
      <div>
        <Label hint="Default rate per hour of instruction">Hourly rate (RM)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">RM</span>
          <input
            type="number"
            min={0} step={25}
            value={form.hourlyRate}
            onChange={(e) => update("hourlyRate", Math.max(0, Number(e.target.value) || 0))}
            className="w-full bg-background border border-border rounded-xl pl-10 pr-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 tabular-nums"
          />
        </div>
        <div className="grid grid-cols-4 gap-1 mt-2">
          {[150, 250, 350, 500].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => update("hourlyRate", m)}
              className={cn(
                "py-1 rounded-md border text-[11px] font-bold tabular-nums",
                form.hourlyRate === m
                  ? "bg-[var(--brand-soft)] border-[var(--brand)] text-[var(--brand-deep)]"
                  : "bg-background border-border text-muted-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Bios / notes (optional)</Label>
        <textarea
          value={form.bio}
          rows={3}
          maxLength={400}
          onChange={(e) => update("bio", e.target.value)}
          placeholder="Background, certifications, languages spoken…"
          className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 resize-none leading-relaxed"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ConfirmStep({ form }: { form: FormState }) {
  return (
    <div className="space-y-5">
      <StepHeader step={2} title="Confirm and invite" hint="We&apos;ll show the password below so you can share it." icon={<Check className="size-5" />} />
      <dl className="divide-y divide-border">
        <Row k="Name">{form.name}</Row>
        <Row k="Email">{form.email}</Row>
        <Row k="Expertise">{form.expertise || "—"}</Row>
        <Row k="Hourly rate">RM {form.hourlyRate.toLocaleString()} / h</Row>
        {form.bio && <Row k="Notes">{form.bio}</Row>}
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

function Label({ children, htmlFor, hint }: { children: React.ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="block mb-2">
      <div className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground">{children}</div>
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

