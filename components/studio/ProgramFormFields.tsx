"use client";

/**
 * ProgramFormFields — the shared form body for the new-program page AND
 * the edit-program page. Both pages have a long-overlapping set of
 * fields (title, description, category, duration, capacity, price,
 * location, syllabus, modules, proposal URLs, thumbnail, itinerary).
 * Previously each page had its own copy of these — ~1200 lines of
 * duplication. This component centralizes the field rendering and
 * per-field state plumbing so the pages only own page-specific logic
 * (upload flow on new, AI Enhance + initial fetch on edit).
 *
 * State: per-field primitives owned internally. Output: a single
 * `onSubmit(payload)` callback fired when the user clicks the
 * "Submit" button rendered at the bottom (or by an external trigger
 * via `registerFormSubmit` for pages that use a floating action panel).
 */

import { useState, useRef, useEffect, useImperativeHandle } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

export type ProgramMode = "create" | "edit";

/**
 * Optional sections to render. The 7 core fields are always rendered.
 * Each feature corresponds to an extra section in the form.
 */
export type ProgramFeature =
  | "modules"
  | "itinerary"
  | "proposal"
  | "thumbnail"
  | "proposalContent";

export interface ProgramModuleRow {
  title: string;
  description?: string;
  durationMins: number;
}

export interface ProgramItineraryItem {
  type: "REGISTRATION" | "MEAL" | "MODULE" | "BREAK" | "CLOSING";
  title: string;
  startTime: string; // "HH:MM"
  endTime: string;
}

/** Payload returned to the parent's onSubmit callback. */
export interface ProgramFormPayload {
  title: string;
  description: string;
  category: string;
  durationHours: number;
  maxParticipants: number;
  pricePerPax: number;
  locationType: "onsite" | "online" | "hybrid";
  modules: { title: string; description?: string; durationMins: number }[];
  itinerary: ProgramItineraryItem[];
  proposalUrl?: string;
  proposalLabel?: string;
  thumbnailUrl?: string;
  proposalContent?: string;
}

export interface ProgramFormFieldsProps {
  mode: ProgramMode;
  /** Which optional sections to render. */
  features: ProgramFeature[];
  /** Pre-fill on edit (full or partial). */
  initialValues?: Partial<ProgramFormPayload>;
  /** Save handler — receives the full payload when the form is submitted. */
  onSubmit: (payload: ProgramFormPayload) => void | Promise<void>;
  /** Disable the submit button while the parent is saving. */
  isSaving?: boolean;
  /** Optional AI Enhance handler (edit page only). */
  onAiEnhance?: () => void;
  aiEnhancing?: boolean;
  /** External submit trigger — parent calls this to submit from outside. */
  registerFormSubmit?: (submit: () => void) => void;
  /** Called whenever a field value changes — enables real-time form checklist. */
  onFieldChange?: (payload: ProgramFormPayload) => void;
}

// ─── Constants (single source of truth) ───────────────────────────────

const CATEGORIES = [
  "Leadership",
  "Technical",
  "Soft Skills",
  "Compliance",
  "Team Building",
  "HR Operations",
  "Other",
] as const;

const LOCATION_TYPES = [
  { value: "onsite" as const, label: "On-Site" },
  { value: "online" as const, label: "Online" },
  { value: "hybrid" as const, label: "Hybrid" },
] as const;

const ITINERARY_TYPES: ProgramItineraryItem["type"][] = [
  "REGISTRATION",
  "MEAL",
  "MODULE",
  "BREAK",
  "CLOSING",
];

// ─── Component ───────────────────────────────────────────────────────

export function ProgramFormFields({
  mode,
  features,
  initialValues,
  onSubmit,
  isSaving = false,
  onAiEnhance,
  aiEnhancing = false,
  onFieldChange,
  registerFormSubmit,
}: ProgramFormFieldsProps) {
  // ─── Field state (per-field primitives) ─────────────────────────
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [category, setCategory] = useState<string>(initialValues?.category ?? "Leadership");
  const [durationHours, setDurationHours] = useState<number>(initialValues?.durationHours ?? 4);
  const [maxParticipants, setMaxParticipants] = useState<number>(
    initialValues?.maxParticipants ?? 20
  );
  const [pricePerPax, setPricePerPax] = useState<number>(initialValues?.pricePerPax ?? 700);
  const [locationType, setLocationType] = useState<"onsite" | "online" | "hybrid">(
    initialValues?.locationType ?? "onsite"
  );
  const [proposalUrl, setProposalUrl] = useState(initialValues?.proposalUrl ?? "");
  const [proposalLabel, setProposalLabel] = useState(initialValues?.proposalLabel ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initialValues?.thumbnailUrl ?? "");
  const [modules, setModules] = useState<ProgramModuleRow[]>(
    initialValues?.modules?.length
      ? initialValues.modules.map((m) => ({
          title: m.title,
          description: (m as { description?: string }).description ?? "",
          durationMins: m.durationMins,
        }))
      : [{ title: "", description: "", durationMins: 60 }]
  );
  const [itinerary, setItinerary] = useState<ProgramItineraryItem[]>(
    initialValues?.itinerary ?? []
  );
  const [proposalContent] = useState<string | undefined>(initialValues?.proposalContent);

  const has = (f: ProgramFeature) => features.includes(f);

  // ─── External submit trigger ─────────────────────────────────────
  const submitRef = useRef<() => void>(() => {});
  submitRef.current = () => {
    onSubmit({
      title,
      description,
      category,
      durationHours,
      maxParticipants,
      pricePerPax,
      locationType,
      modules: modules.filter((m) => m.title.trim()).map((m) => ({
        title: m.title,
        description: m.description,
        durationMins: m.durationMins,
      })),
      itinerary,
      ...(has("proposal") ? { proposalUrl, proposalLabel } : {}),
      ...(has("thumbnail") ? { thumbnailUrl } : {}),
      proposalContent,
    });
  };
  useEffect(() => {
    if (registerFormSubmit) {
      registerFormSubmit(() => submitRef.current());
    }
  }, [registerFormSubmit]);

  // Notify parent of field changes for the live form checklist.
  // Use a ref for the callback to avoid re-triggering when the parent
  // creates a new function reference (which happens on every render
  // with inline arrow functions).
  const onFieldChangeRef = useRef(onFieldChange);
  onFieldChangeRef.current = onFieldChange;

  useEffect(() => {
    const cb = onFieldChangeRef.current;
    if (!cb) return;
    cb({
      title,
      description,
      category,
      durationHours,
      maxParticipants,
      pricePerPax,
      locationType,
      modules: modules.filter((m) => m.title.trim()),
      itinerary,
      ...(has("proposal") ? { proposalUrl, proposalLabel } : {}),
      ...(has("thumbnail") ? { thumbnailUrl } : {}),
      proposalContent,
    });
  }, [
    title, description, category, durationHours,
    maxParticipants, pricePerPax, locationType,
    modules, itinerary, proposalUrl, proposalLabel, thumbnailUrl, proposalContent,
  ]);

  return (
    <div className="space-y-6">
      {/* ── Card 1: Core program info ─────────────────────────── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="prog-title" className="text-sm font-medium">
              Program Title <span className="text-rose-500">*</span>
            </label>
            <Input
              id="prog-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Transformational Leadership"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="prog-desc" className="text-sm font-medium">
                Description
              </label>
              {mode === "edit" && onAiEnhance ? (
                <button
                  type="button"
                  onClick={onAiEnhance}
                  disabled={aiEnhancing || !title.trim()}
                  className="text-xs text-violet-600 hover:text-violet-800 flex items-center gap-1 disabled:opacity-50"
                  aria-label="Enhance description with AI"
                >
                  {aiEnhancing ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Sparkles className="size-3" />
                  )}
                  Enhance with AI
                </button>
              ) : null}
            </div>
            <Textarea
              id="prog-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the program..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  aria-pressed={category === cat}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    category === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent hover:bg-accent/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="prog-dur" className="text-sm font-medium">
                Duration (hours)
              </label>
              <Input
                id="prog-dur"
                type="number"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                min={1}
                max={40}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="prog-cap" className="text-sm font-medium">
                Max Participants
              </label>
              <Input
                id="prog-cap"
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                min={1}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="prog-price" className="text-sm font-medium">
                Price / Pax (RM)
              </label>
              <Input
                id="prog-price"
                type="number"
                value={pricePerPax}
                onChange={(e) => setPricePerPax(Number(e.target.value))}
                min={0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <div className="flex gap-1" role="radiogroup">
              {LOCATION_TYPES.map((lt) => (
                <button
                  key={lt.value}
                  type="button"
                  role="radio"
                  aria-checked={locationType === lt.value}
                  onClick={() => setLocationType(lt.value)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    locationType === lt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent hover:bg-accent/80"
                  }`}
                >
                  {lt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Proposal + Thumbnail (edit only) ────────────────────── */}
      {has("proposal") || has("thumbnail") ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {has("proposal") ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="prog-prop-url" className="text-sm font-medium">
                    Proposal URL
                  </label>
                  <Input
                    id="prog-prop-url"
                    value={proposalUrl}
                    onChange={(e) => setProposalUrl(e.target.value)}
                    placeholder="/proposals/my-training.pdf"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="prog-prop-label" className="text-sm font-medium">
                    Proposal Label
                  </label>
                  <Input
                    id="prog-prop-label"
                    value={proposalLabel}
                    onChange={(e) => setProposalLabel(e.target.value)}
                    placeholder="e.g. Full training proposal with pricing"
                  />
                </div>
              </div>
            ) : null}
            {has("thumbnail") ? (
              <div className="space-y-2">
                <label htmlFor="prog-thumb" className="text-sm font-medium">
                  Thumbnail URL
                </label>
                <Input
                  id="prog-thumb"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="/thumbnails/custom.svg or https://..."
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* ── AI-Generated Proposal (read-only display) ────────────── */}
      {proposalContent ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Training Proposal</label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(proposalContent).catch(() => {});
                }}
                className="text-xs text-primary hover:underline"
                aria-label="Copy proposal to clipboard"
              >
                Copy to clipboard
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 max-h-64 overflow-y-auto">
              <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {proposalContent}
              </pre>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              This proposal was AI-generated from the uploaded file. Review and edit before sharing.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Modules (each module's description replaces the old syllabus) ── */}

      {has("modules") ? (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <label className="text-sm font-medium">Modules</label>
            {modules.map((mod, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={mod.title}
                    onChange={(e) => {
                      const next = [...modules];
                      next[i] = { ...next[i], title: e.target.value };
                      setModules(next);
                    }}
                    placeholder="Module title"
                  />
                  <Input
                    value={mod.description ?? ""}
                    onChange={(e) => {
                      const next = [...modules];
                      next[i] = { ...next[i], description: e.target.value };
                      setModules(next);
                    }}
                    placeholder="Module description / topic content (replaces syllabus)"
                    className="text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={mod.durationMins}
                      onChange={(e) => {
                        const next = [...modules];
                        next[i] = { ...next[i], durationMins: Number(e.target.value) };
                        setModules(next);
                      }}
                      className="w-24"
                      min={15}
                      max={480}
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                </div>
                {modules.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setModules(modules.filter((_, idx) => idx !== i))}
                    aria-label={`Remove module ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setModules([...modules, { title: "", description: "", durationMins: 60 }])}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add module
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Itinerary (auto-generated from document → suggested schedule) ── */}
      {true ? (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Program Itinerary</label>
              <button
                type="button"
                onClick={() =>
                  setItinerary([
                    ...itinerary,
                    { type: "MODULE", title: "", startTime: "09:00", endTime: "10:00" },
                  ])
                }
                className="text-xs text-primary hover:underline"
              >
                + Add Time Slot
              </button>
            </div>
            {itinerary.length === 0 ? (
              <p className="text-sm text-muted-foreground">No time slots yet.</p>
            ) : (
              <>
                {itinerary.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30"
                  >
                    <select
                      value={item.type}
                      onChange={(e) => {
                        const next = [...itinerary];
                        next[i] = { ...next[i], type: e.target.value as ProgramItineraryItem["type"] };
                        setItinerary(next);
                      }}
                      className="w-28 h-8 rounded-md border bg-card px-2 text-xs"
                      aria-label={`Slot ${i + 1} type`}
                    >
                      {ITINERARY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={item.title}
                      onChange={(e) => {
                        const next = [...itinerary];
                        next[i] = { ...next[i], title: e.target.value };
                        setItinerary(next);
                      }}
                      placeholder="Title"
                      className="flex-1 h-8 text-xs"
                    />
                    <Input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => {
                        const next = [...itinerary];
                        next[i] = { ...next[i], startTime: e.target.value };
                        setItinerary(next);
                      }}
                      className="w-24 h-8 text-xs"
                      aria-label={`Slot ${i + 1} start time`}
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => {
                        const next = [...itinerary];
                        next[i] = { ...next[i], endTime: e.target.value };
                        setItinerary(next);
                      }}
                      className="w-24 h-8 text-xs"
                      aria-label={`Slot ${i + 1} end time`}
                    />
                    <button
                      type="button"
                      onClick={() => setItinerary(itinerary.filter((_, idx) => idx !== i))}
                      className="text-xs text-destructive hover:underline flex-shrink-0"
                      aria-label={`Remove slot ${i + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <ItineraryTotal itinerary={itinerary} />
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* ── Internal Submit Button (only when no external trigger) ─ */}
      {registerFormSubmit ? null : (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => submitRef.current()}
            disabled={isSaving || !title.trim()}
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : mode === "create" ? (
              "Create Program"
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Small footer: total hours across all time slots. */
function ItineraryTotal({ itinerary }: { itinerary: ProgramItineraryItem[] }) {
  const totalMins = itinerary.reduce((sum, item) => {
    const [sh, sm] = item.startTime.split(":").map(Number);
    const [eh, em] = item.endTime.split(":").map(Number);
    if (isNaN(sh) || isNaN(eh)) return sum;
    return sum + (eh * 60 + em) - (sh * 60 + sm);
  }, 0);
  const hours = (totalMins / 60).toFixed(1);
  return (
    <p className="text-xs text-muted-foreground text-right">
      Total: {hours} hours across {itinerary.length} slot{itinerary.length === 1 ? "" : "s"}
    </p>
  );
}
