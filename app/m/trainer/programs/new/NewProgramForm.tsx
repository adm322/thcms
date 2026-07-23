"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Clock, MapPin, Sparkles,} from "lucide-react";

import { cn } from "@/lib/utils";
import { WizardStepper, WizardNav } from "@/components/wizard";

interface Props {
  categories:    string[];
  locationTypes: { value: string; label: string }[];
}

type Step = 0 | 1 | 2;

interface FormData {
  title:           string;
  description:     string;
  category:        string;
  durationHours:   number;
  maxParticipants: number;
  pricePerPax:     number;
  locationType:    string;
}

const STEPS = [
  { label: "Basics",    icon: FileText },
  { label: "Logistics", icon: Clock    },
  { label: "Review",    icon: Sparkles  },
] as const;

export function NewProgramForm({ categories, locationTypes }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    title:           "",
    description:     "",
    category:        categories[0],
    durationHours:   4,
    maxParticipants: 20,
    pricePerPax:     0,
    locationType:    locationTypes[0].value,
  });

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const stepErrors = useMemo(() => ({
    0: form.title.trim().length < 3
      ? "Title must be at least 3 characters."
      : form.description.trim().length < 10
      ? "Description must be at least 10 characters."
      : null,
    1: form.durationHours <= 0
      ? "Duration must be greater than 0."
      : form.maxParticipants <= 0
      ? "Max participants must be greater than 0."
      : form.pricePerPax < 0
      ? "Price cannot be negative."
      : null,
    2: null,
  } as const), [form]);

  function next() {
    if (stepErrors[step]) { setErr(stepErrors[step]); return; }
    setErr(null);
    setStep((s) => (Math.min(2, s + 1) as Step));
  }
  function back() {
    setErr(null);
    setStep((s) => (Math.max(0, s - 1) as Step));
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/trainer/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "DRAFT" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? `Failed (${res.status})`);
        setBusy(false);
        return;
      }
      router.push("/m");
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
        className="bg-card border border-border rounded-3xl shadow-sm p-5 min-h-72"
        key={step /* re-mount on step change so animations feel snappy */}
      >
        {err && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {err}
          </div>
        )}

        {step === 0 && (
          <BasicsStep
            form={form}
            update={update}
            categories={categories}
            error={stepErrors[0]}
          />
        )}
        {step === 1 && (
          <LogisticsStep
            form={form}
            update={update}
            locationTypes={locationTypes}
            error={stepErrors[1]}
          />
        )}
        {step === 2 && <ReviewStep form={form} locationTypes={locationTypes} />}
      </div>

      <WizardNav
        step={step}
        totalSteps={STEPS.length}
        busy={busy}
        submitLabel="Save as draft"
        onBack={back}
        onContinue={next}
        onSubmit={save}
      />
    </div>
  );
}

/* ─── Steps ──────────────────────────────────────────────────────────────── */

function BasicsStep({
  form, update, categories, error,
}: {
  form:    FormData;
  update:  <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  categories: string[];
  error:  string | null;
}) {
  return (
    <div className="space-y-5">
      <StepHeader
        step={0}
        title="What is this program?"
        hint="The name and short pitch attendees will see in the catalog."
        icon={<FileText className="size-5" />}
      />

      <div>
        <Label htmlFor="title" hint="Shown to HR teams + attendees">
          Title
        </Label>
        <input
          id="title"
          value={form.title}
          maxLength={120}
          autoComplete="off"
          autoFocus
          placeholder="e.g. New Manager Bootcamp"
          onChange={(e) => update("title", e.target.value)}
          className="w-full bg-background border border-border rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
        <div className="text-[11px] text-muted-foreground mt-1">{form.title.length} / 120</div>
      </div>

      <div>
        <Label htmlFor="description" hint="At least 10 characters">
          Description
        </Label>
        <textarea
          id="description"
          value={form.description}
          rows={5}
          maxLength={500}
          placeholder="What will attendees learn? Who is this for? Any prerequisites?"
          onChange={(e) => update("description", e.target.value)}
          className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 resize-none leading-relaxed"
        />
        <div className="text-[11px] text-muted-foreground mt-1">{form.description.length} / 500</div>
      </div>

      <div>
        <Label hint="Pick the closest fit — you can refine later">
          Category
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((c) => {
            const active = form.category === c;
            return (
              <label
                key={c}
                className={cn(
                  "rounded-xl border p-3 text-center cursor-pointer transition-colors text-sm font-bold",
                  active
                    ? "bg-[var(--brand-soft)] border-[var(--brand)] text-[var(--brand-deep)]"
                    : "bg-background border-border text-foreground has-[:checked]:bg-[var(--brand-soft)] has-[:checked]:border-[var(--brand)]",
                )}
              >
                <input
                  type="radio"
                  name="category"
                  value={c}
                  checked={active}
                  onChange={() => update("category", c)}
                  className="sr-only peer"
                />
                {c}
              </label>
            );
          })}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function LogisticsStep({
  form, update, locationTypes, error,
}: {
  form:    FormData;
  update:  <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  locationTypes: { value: string; label: string }[];
  error:  string | null;
}) {
  return (
    <div className="space-y-5">
      <StepHeader
        step={1}
        title="How does it run?"
        hint="Schedule, capacity, and pricing. You can change these later."
        icon={<Clock className="size-5" />}
      />

      <div>
        <Label hint="Total hours of instruction">Duration (hours)</Label>
        <NumberStepper
          value={form.durationHours}
          min={0.5} step={0.5} max={40}
          onChange={(v) => update("durationHours", v)}
          suffix={form.durationHours === 1 ? "hour" : "hours"}
        />
      </div>

      <div>
        <Label hint="Maximum attendees per session">Capacity</Label>
        <NumberStepper
          value={form.maxParticipants}
          min={1} step={1} max={500}
          onChange={(v) => update("maxParticipants", v)}
          suffix={form.maxParticipants === 1 ? "person" : "people"}
        />
      </div>

      <div>
        <Label hint="Leave 0 if pricing is set per booking instead">Price per pax (RM)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">RM</span>
          <input
            type="number"
            min={0} step={50}
            value={form.pricePerPax}
            onChange={(e) => update("pricePerPax", Math.max(0, Number(e.target.value) || 0))}
            className="w-full bg-background border border-border rounded-xl pl-10 pr-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 tabular-nums"
          />
        </div>
      </div>

      <div>
        <Label icon={<MapPin className="size-3.5" />} hint="Where will it be held?">
          Location type
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {locationTypes.map((l) => {
            const active = form.locationType === l.value;
            return (
              <label
                key={l.value}
                className={cn(
                  "rounded-xl border p-3 text-center cursor-pointer transition-colors",
                  active
                    ? "bg-[var(--brand-soft)] border-[var(--brand)] text-[var(--brand-deep)]"
                    : "bg-background border-border text-muted-foreground",
                )}
              >
                <input
                  type="radio"
                  name="locationType"
                  value={l.value}
                  checked={active}
                  onChange={() => update("locationType", l.value)}
                  className="sr-only peer"
                />
                <div className="text-sm font-bold">{l.label}</div>
              </label>
            );
          })}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ReviewStep({
  form, locationTypes,
}: {
  form: FormData;
  locationTypes: { value: string; label: string }[];
}) {
  const location = locationTypes.find((l) => l.value === form.locationType)?.label ?? form.locationType;
  const cat      = form.category;
  return (
    <div className="space-y-5">
      <StepHeader
        step={2}
        title="Looks right?"
        hint="Confirm and save as draft. You can refine modules and quizzes from the desktop."
        icon={<Sparkles className="size-5" />}
      />

      <dl className="divide-y divide-border">
        <Row k="Title">
          <span className="font-bold block">{form.title}</span>
        </Row>
        <Row k="Description">{form.description}</Row>
        <Row k="Category">{cat}</Row>
        <Row k="Duration">{form.durationHours} {form.durationHours === 1 ? "hour" : "hours"}</Row>
        <Row k="Capacity">{form.maxParticipants} {form.maxParticipants === 1 ? "person" : "people"}</Row>
        <Row k="Price / pax">RM {form.pricePerPax.toLocaleString()}</Row>
        <Row k="Location">{location}</Row>
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
        <div className="text-[11px] uppercase tracking-[0.08em] font-bold text-[var(--brand-deep)]">
          Step {step + 1} of 3
        </div>
        <h2 className="text-lg font-extrabold tracking-tight leading-tight mt-0.5">{title}</h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{hint}</p>
      </div>
    </div>
  );
}

function Label({
  children, hint, htmlFor, icon,
}: {
  children: React.ReactNode;
  hint?:   string;
  htmlFor?: string;
  icon?:   React.ReactNode;
}) {
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

function NumberStepper({
  value, min, max, step, onChange, suffix,
}: {
  value:    number;
  min:      number;
  max:      number;
  step:     number;
  onChange: (v: number) => void;
  suffix?:  string;
}) {
  function bump(direction: 1 | -1) {
    const next = value + direction * step;
    onChange(Math.min(max, Math.max(min, Number(next.toFixed(2)))));
  }
  return (
    <div>
      <div className="flex items-stretch border border-border rounded-xl overflow-hidden bg-background">
        <button
          type="button"
          onClick={() => bump(-1)}
          className="w-12 grid place-items-center text-lg font-bold text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
          disabled={value <= min}
          aria-label="Decrease"
        >
          −
        </button>
        <div className="flex-1 grid place-items-center border-x border-border tabular-nums">
          <span className="text-base font-bold">{value}</span>
        </div>
        <button
          type="button"
          onClick={() => bump(1)}
          className="w-12 grid place-items-center text-lg font-bold text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
          disabled={value >= max}
          aria-label="Increase"
        >
          +
        </button>
      </div>
      {suffix && <div className="text-[11px] text-muted-foreground mt-1.5 text-center">{suffix}</div>}
    </div>
  );
}

