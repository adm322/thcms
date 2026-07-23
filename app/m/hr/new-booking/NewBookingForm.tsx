"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Users, MapPin, Video,
  Sparkles, Check, AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { WizardStepper, WizardNav } from "@/components/wizard";

export interface ProgramOption {
  id:            string;
  title:         string;
  category:      string;
  trainer:       string;
  pricePerPax:   number;
  durationHours: number;
  locationType:  string;
}

interface FormState {
  programId:         string;
  programDate:       string;
  participantCount:  number;
  venuePreference:   "as_program" | "online" | "onsite";
  venueAddress:      string;
  meetingLink:       string;
}

type Step = 0 | 1 | 2;

const VENUE_LABEL: Record<FormState["venuePreference"], string> = {
  as_program: "Use program default",
  online:     "Online (Zoom / Meet)",
  onsite:     "My own venue",
};

const STEPS = [
  { label: "Program",   icon: Sparkles },
  { label: "Logistics", icon: MapPin   },
  { label: "Review",    icon: Check    },
] as const;

export function NewBookingForm({ programs }: { programs: ProgramOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState<string | null>(null);

  const defaultDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  const [form, setForm] = useState<FormState>({
    programId:        programs[0]?.id ?? "",
    programDate:      defaultDate,
    participantCount: 10,
    venuePreference:  "as_program",
    venueAddress:     "",
    meetingLink:      "",
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const selected = programs.find((p) => p.id === form.programId);
  const totalFee = selected ? selected.pricePerPax * form.participantCount : 0;
  const needsOnlineLink = form.venuePreference === "online" ||
    (form.venuePreference === "as_program" && selected?.locationType === "online") ||
    (form.venuePreference === "as_program" && selected?.locationType === "hybrid");

  const stepErrors = useMemo(() => {
    return {
      0: programs.length === 0
        ? "No published programs available."
        : !form.programId
        ? "Pick a program."
        : !form.programDate || new Date(form.programDate) < new Date(new Date().toDateString())
        ? "Date must be in the future."
        : null,
      1: form.participantCount <= 0
        ? "Add at least 1 participant."
        : needsOnlineLink && !form.meetingLink
        ? "Provide a Zoom or Google Meet link."
        : !needsOnlineLink && form.venuePreference === "onsite" && !form.venueAddress
        ? "Add a venue address, or switch back to program default."
        : form.meetingLink && !/zoom\.us|meet\.google\.com/.test(form.meetingLink)
        ? "Only zoom.us or meet.google.com links are accepted."
        : null,
      2: null,
    } as const;
  }, [form, programs, needsOnlineLink]);

  function next() {
    if (stepErrors[step]) { setErr(stepErrors[step]); return; }
    setErr(null);
    setStep((s) => (Math.min(2, s + 1) as Step));
  }
  function back() {
    setErr(null);
    setStep((s) => (Math.max(0, s - 1) as Step));
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/hr/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId:         form.programId,
          programDate:       new Date(form.programDate).toISOString(),
          participantCount:  form.participantCount,
          venuePreference:   form.venuePreference,
          venueAddress:      form.venueAddress || undefined,
          meetingLink:       form.meetingLink || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? `Failed (${res.status})`);
        setBusy(false);
        return;
      }
      router.push("/m/hr/calendar");
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
        key={step}
      >
        {err && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive inline-flex items-start gap-2">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {step === 0 && (
          <ProgramStep
            programs={programs}
            selectedId={form.programId}
            onPick={(id) => update("programId", id)}
            date={form.programDate}
            onDate={(d) => update("programDate", d)}
            error={stepErrors[0]}
          />
        )}
        {step === 1 && (
          <LogisticsStep
            form={form}
            update={update}
            needsOnlineLink={needsOnlineLink}
            error={stepErrors[1]}
          />
        )}
        {step === 2 && (
          <ReviewStep
            form={form}
            program={selected}
            totalFee={totalFee}
            venueLabel={VENUE_LABEL[form.venuePreference]}
          />
        )}
      </div>

      <WizardNav
        step={step}
        totalSteps={STEPS.length}
        busy={busy}
        submitLabel="Submit request"
        onBack={back}
        onContinue={next}
        onSubmit={submit}
      />
    </div>
  );
}

/* ─── Steps ──────────────────────────────────────────────────────────────── */

function ProgramStep({
  programs, selectedId, onPick, date, onDate, error,
}: {
  programs:    ProgramOption[];
  selectedId:  string;
  onPick:      (id: string) => void;
  date:        string;
  onDate:      (d: string) => void;
  error:       string | null;
}) {
  if (programs.length === 0) {
    return (
      <div className="text-center py-10">
        <Sparkles className="mx-auto size-8 text-muted-foreground/60 mb-2" />
        <h2 className="text-sm font-semibold">No published programs</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
          Once an admin publishes programs in the catalog, they&apos;ll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StepHeader
        step={0}
        title="What program are you booking?"
        hint="Pick from the live catalog and lock in a date."
        icon={<Sparkles className="size-5" />}
      />

      <div>
        <Label>Program</Label>
        <div className="space-y-2 max-h-72 overflow-y-auto -mx-1 px-1">
          {programs.map((p) => {
            const active = p.id === selectedId;
            return (
              <label
                key={p.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors",
                  active
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                    : "border-border bg-background has-[:checked]:bg-[var(--brand-soft)] has-[:checked]:border-[var(--brand)]",
                )}
              >
                <input
                  type="radio"
                  name="programId"
                  value={p.id}
                  checked={active}
                  onChange={() => onPick(p.id)}
                  className="sr-only peer"
                />
                <div
                  className={cn(
                    "size-9 rounded-xl grid place-items-center shrink-0",
                    active ? "bg-white text-[var(--brand-deep)]" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Sparkles className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold leading-tight">{p.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-2 flex-wrap">
                    <span className="uppercase tracking-wide font-semibold">{p.category}</span>
                    <span>· {p.durationHours}h</span>
                    <span>· RM {p.pricePerPax.toLocaleString()}/pax</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    Trainer · {p.trainer}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <Label icon={<Calendar className="size-3.5" />}>Date</Label>
        <input
          type="date"
          value={date}
          onChange={(e) => onDate(e.target.value)}
          className="w-full bg-background border border-border rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function LogisticsStep({
  form, update, needsOnlineLink, error,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  needsOnlineLink: boolean;
  error:  string | null;
}) {
  return (
    <div className="space-y-5">
      <StepHeader
        step={1}
        title="Where + how many?"
        hint="Pick capacity and venue. We tell the trainer on submit."
        icon={<MapPin className="size-5" />}
      />

      <div>
        <Label icon={<Users className="size-3.5" />}>Participants</Label>
        <NumberStepper
          value={form.participantCount}
          min={1} step={1} max={500}
          onChange={(v) => update("participantCount", v)}
          suffix={form.participantCount === 1 ? "person" : "people"}
        />
      </div>

      <div>
        <Label>Venue</Label>
        <div className="grid grid-cols-1 gap-2">
          {(["as_program", "online", "onsite"] as const).map((v) => {
            const active = form.venuePreference === v;
            return (
              <label
                key={v}
                className={cn(
                  "rounded-xl border p-3 text-left cursor-pointer transition-colors",
                  active
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                    : "bg-background border-border has-[:checked]:bg-[var(--brand-soft)] has-[:checked]:border-[var(--brand)]",
                )}
              >
                <input
                  type="radio"
                  name="venuePreference"
                  value={v}
                  checked={active}
                  onChange={() => update("venuePreference", v)}
                  className="sr-only peer"
                />
                <div className="text-sm font-bold" style={active ? { color: "var(--brand-deep)" } : undefined}>
                  {VENUE_LABEL[v]}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {v === "as_program" && "Trainer sets it up — no extra input needed."}
                  {v === "online"     && "We&apos;ll need a Zoom or Google Meet link."}
                  {v === "onsite"     && "You&apos;ll book your own room — add the address below."}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {needsOnlineLink && (
        <div>
          <Label icon={<Video className="size-3.5" />}>Meeting link</Label>
          <input
            type="url"
            value={form.meetingLink}
            onChange={(e) => update("meetingLink", e.target.value)}
            placeholder="https://zoom.us/j/... or https://meet.google.com/..."
            className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
          />
          <div className="text-[11px] text-muted-foreground mt-1">Accepted: zoom.us or meet.google.com URLs.</div>
        </div>
      )}

      {form.venuePreference === "onsite" && (
        <div>
          <Label>Venue address</Label>
          <textarea
            value={form.venueAddress}
            onChange={(e) => update("venueAddress", e.target.value)}
            rows={2}
            placeholder="Building, street, city"
            className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 resize-none"
          />
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ReviewStep({
  form, program, totalFee, venueLabel,
}: {
  form: FormState;
  program: ProgramOption | undefined;
  totalFee: number;
  venueLabel: string;
}) {
  if (!program) return null;
  const dateStr = new Date(form.programDate).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  return (
    <div className="space-y-5">
      <StepHeader
        step={2}
        title="Confirm and send"
        hint="We&apos;ll create a PENDING booking and notify the trainer."
        icon={<Check className="size-5" />}
      />

      <dl className="divide-y divide-border">
        <Row k="Program">{program.title}</Row>
        <Row k="Date">{dateStr}</Row>
        <Row k="Category">{program.category}</Row>
        <Row k="Participants">{form.participantCount}</Row>
        <Row k="Venue">{venueLabel}{form.venueAddress ? ` · ${form.venueAddress}` : ""}</Row>
        {form.meetingLink && <Row k="Link"><a href={form.meetingLink} target="_blank" rel="noreferrer" className="underline break-all">{form.meetingLink}</a></Row>}
      </dl>

      <div
        className="rounded-2xl p-4 text-white"
        style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
      >
        <div className="text-[11px] uppercase tracking-wide opacity-85">Estimated total</div>
        <div className="text-2xl font-extrabold tabular-nums mt-1">RM {totalFee.toLocaleString()}</div>
        <div className="text-[11px] opacity-85 mt-1">{form.participantCount} × RM {program.pricePerPax.toLocaleString()} / pax</div>
      </div>
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

function Label({ children, htmlFor, icon }: { children: React.ReactNode; htmlFor?: string; icon?: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block mb-2">
      <div className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground inline-flex items-center gap-1.5">
        {icon}{children}
      </div>
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
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; suffix?: string;
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

