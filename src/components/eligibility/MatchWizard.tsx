"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Wallet,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  Award,
  Info,
  Compass,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { evaluate } from "@/lib/eligibility/evaluate";
import { COUNTRIES, INSTITUTIONS } from "@/lib/eligibility/catalog";
import { FIELDS } from "@/lib/eligibility/types";
import type {
  ApplicantProfile,
  EvaluationResult,
  ProgramMatch,
  StudyLevel,
  EnglishTest,
} from "@/lib/eligibility/types";

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink placeholder-faint transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

const STEPS = ["Goal", "Academics", "English & tests", "Results"];

type Draft = Partial<ApplicantProfile> & {
  studyLevel: StudyLevel;
  englishTest: EnglishTest;
};

const initialDraft: Draft = {
  studyLevel: "Master",
  englishTest: "IELTS",
  cgpaScale: 4.0,
  preferredCountries: [],
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-muted">{label}</span>
        {hint && <span className="text-xs text-faint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-paper-2 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active ? "text-on-ink" : "text-muted hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId="seg-active"
                className="absolute inset-0 rounded-full bg-ink"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  step = "0.01",
  min,
  max,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  step?: string;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      max={max}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      className={inputCls}
    />
  );
}

const verdictStyles: Record<string, { ring: string; chip: string; label: string }> = {
  eligible: { ring: "border-l-[3px] border-l-positive", chip: "bg-[#eaf3ed] text-positive", label: "Eligible" },
  conditional: { ring: "border-l-[3px] border-l-warning", chip: "bg-accent-soft text-accent-ink", label: "Conditional" },
  pathway: { ring: "border-l-[3px] border-l-line-strong", chip: "bg-paper-2 text-muted", label: "Pathway" },
};

function ProgramCard({ match }: { match: ProgramMatch }) {
  const { program: p, reasons, likelihood, pathway, verdict } = match;
  const v = verdictStyles[verdict] ?? verdictStyles.pathway;

  return (
    <div className={`card ${v.ring} p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold leading-snug text-ink">{p.programName}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {p.university}
            {p.city ? ` · ${p.city}` : ""} · {p.country}
          </p>
        </div>
        <span className={`chip ${v.chip}`}>
          {v.label}
          {verdict !== "pathway" && <span className="opacity-70">· {likelihood}</span>}
        </span>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 text-muted">
          <Wallet className="h-4 w-4 flex-none text-faint" strokeWidth={1.75} />
          <span>{p.tuition}</span>
        </div>
        {p.deadline && (
          <div className="flex items-center gap-2 text-muted">
            <Calendar className="h-4 w-4 flex-none text-faint" strokeWidth={1.75} />
            <span>{p.deadline}</span>
          </div>
        )}
        {p.scholarship && (
          <div className="flex items-start gap-2 text-muted sm:col-span-2">
            <Award className="h-4 w-4 flex-none text-accent" strokeWidth={1.75} />
            <span>{p.scholarship}</span>
          </div>
        )}
      </dl>

      <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
        {reasons.map((r, i) => (
          <li key={i} className="flex items-start gap-2">
            {r.kind === "pass" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-positive" strokeWidth={2} />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none text-warning" strokeWidth={2} />
            )}
            <span className={r.kind === "pass" ? "text-muted" : "text-ink"}>{r.label}</span>
          </li>
        ))}
      </ul>

      {pathway && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-paper-2 p-3 text-sm">
          <Compass className="mt-0.5 h-4 w-4 flex-none text-accent" strokeWidth={1.75} />
          <span className="text-ink">
            <span className="font-semibold">Recommended pathway: </span>
            {pathway}
          </span>
        </div>
      )}
    </div>
  );
}

function Bucket({ title, blurb, matches }: { title: string; blurb: string; matches: ProgramMatch[] }) {
  if (matches.length === 0) return null;
  return (
    <div>
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="h3 text-ink">{title}</h2>
        <span className="text-sm font-medium text-faint">{matches.length}</span>
      </div>
      <p className="mb-5 max-w-2xl text-sm text-muted">{blurb}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {matches.map((m) => (
          <ProgramCard key={m.program.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function SummaryBar({ result }: { result: EvaluationResult }) {
  const s = result.summary;
  const items: { label: string; value: string }[] = [];
  if (s.usGpa !== null) items.push({ label: "US GPA (≈)", value: `${s.usGpa.toFixed(2)}/4.0` });
  if (s.germanGrade !== null) items.push({ label: "German grade", value: s.germanGrade.toFixed(2) });
  if (s.ukClass) items.push({ label: "UK class", value: s.ukClass });
  if (s.noosrSection) items.push({ label: "AU NOOSR", value: `Section ${s.noosrSection}` });
  if (s.anabinStatus !== "N/A") items.push({ label: "Anabin", value: s.anabinStatus });
  if (items.length === 0) return null;

  return (
    <div className="card p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-faint">Your profile, normalized</p>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        {items.map((it) => (
          <div key={it.label}>
            <p className="font-display text-lg font-semibold text-ink">{it.value}</p>
            <p className="text-xs text-muted">{it.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MatchWizard() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const toggleCountry = (c: string) =>
    setDraft((d) => {
      const cur = d.preferredCountries ?? [];
      return { ...d, preferredCountries: cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c] };
    });

  const isMaster = draft.studyLevel === "Master";

  const totalMatches = useMemo(
    () => (result ? result.eligible.length + result.conditional.length + result.pathway.length : 0),
    [result],
  );

  function runMatch() {
    setResult(evaluate(draft as ApplicantProfile));
    setStep(3);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restart() {
    setDraft(initialDraft);
    setResult(null);
    setStep(0);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="container-edge max-w-4xl">
      {/* Progress */}
      <div className="mb-10 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={i > step}
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                i === step ? "text-ink" : i < step ? "text-accent hover:underline" : "text-faint"
              }`}
            >
              <span
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold ${
                  i === step
                    ? "bg-ink text-on-ink"
                    : i < step
                      ? "bg-accent-soft text-accent-ink"
                      : "border border-line text-faint"
                }`}
              >
                {i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Step 0 — Goal */}
          {step === 0 && (
            <div className="card p-6 md:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink">What are you aiming for?</h2>
              <div className="mt-6 space-y-6">
                <Field label="Study level">
                  <Segmented<StudyLevel>
                    options={[
                      { value: "Bachelor", label: "Bachelor's" },
                      { value: "Master", label: "Master's" },
                    ]}
                    value={draft.studyLevel}
                    onChange={(v) => set({ studyLevel: v })}
                  />
                </Field>

                <Field label={isMaster ? "Intended field of study" : "Field you want to study"}>
                  <select
                    className={inputCls}
                    value={draft.intendedField ?? ""}
                    onChange={(e) => set({ intendedField: e.target.value || undefined })}
                  >
                    <option value="">Select a field</option>
                    {FIELDS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Preferred destinations" hint="Optional — leave empty for anywhere">
                  <div className="flex flex-wrap gap-2">
                    {COUNTRIES.map((c) => {
                      const on = (draft.preferredCountries ?? []).includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCountry(c)}
                          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                            on
                              ? "border-accent bg-accent-soft text-accent-ink"
                              : "border-line text-muted hover:border-line-strong hover:text-ink"
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>

              <div className="mt-8 flex justify-end">
                <Button onClick={() => setStep(1)} withArrow>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 1 — Academics */}
          {step === 1 && (
            <div className="card p-6 md:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink">Your academic results</h2>
              <p className="mt-1 text-sm text-muted">Bangladeshi GPAs are on the 5.0 scale.</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="SSC GPA" hint="out of 5.0">
                  <NumberInput value={draft.sscGpa} onChange={(v) => set({ sscGpa: v })} placeholder="5.00" min={0} max={5} />
                </Field>
                <Field label="HSC GPA" hint="out of 5.0">
                  <NumberInput value={draft.hscGpa} onChange={(v) => set({ hscGpa: v })} placeholder="4.85" min={0} max={5} />
                </Field>
              </div>

              {isMaster && (
                <div className="mt-6 space-y-4 border-t border-line pt-6">
                  <p className="text-sm font-medium text-ink">Bachelor&apos;s degree</p>
                  <Field label="Your degree field">
                    <select
                      className={inputCls}
                      value={draft.bachelorField ?? ""}
                      onChange={(e) => set({ bachelorField: e.target.value || undefined })}
                    >
                      <option value="">Select your background</option>
                      {FIELDS.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="CGPA" hint={`out of ${draft.cgpaScale ?? 4}`}>
                      <NumberInput value={draft.cgpa} onChange={(v) => set({ cgpa: v })} placeholder="3.42" min={0} max={draft.cgpaScale ?? 4} />
                    </Field>
                    <Field label="CGPA scale">
                      <Segmented<string>
                        options={[
                          { value: "4", label: "4.0" },
                          { value: "5", label: "5.0" },
                        ]}
                        value={String(draft.cgpaScale ?? 4)}
                        onChange={(v) => set({ cgpaScale: Number(v) })}
                      />
                    </Field>
                  </div>
                  <Field label="Your university" hint="determines AU & German recognition">
                    <select
                      className={inputCls}
                      value={draft.institutionKey ?? ""}
                      onChange={(e) => set({ institutionKey: e.target.value || undefined })}
                    >
                      <option value="">Select your university</option>
                      {INSTITUTIONS.map((i) => (
                        <option key={i.key} value={i.key}>
                          {i.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(0)} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <Button onClick={() => setStep(2)} withArrow>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — English & tests */}
          {step === 2 && (
            <div className="card p-6 md:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink">English & standardized tests</h2>

              <div className="mt-6 space-y-6">
                <Field label="English proficiency test">
                  <Segmented<EnglishTest>
                    options={[
                      { value: "IELTS", label: "IELTS" },
                      { value: "TOEFL", label: "TOEFL" },
                      { value: "PTE", label: "PTE" },
                      { value: "Duolingo", label: "Duolingo" },
                      { value: "None", label: "None yet" },
                    ]}
                    value={draft.englishTest}
                    onChange={(v) => set({ englishTest: v })}
                  />
                </Field>

                {draft.englishTest !== "None" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={`${draft.englishTest} overall score`}>
                      <NumberInput
                        value={draft.englishOverall}
                        onChange={(v) => set({ englishOverall: v })}
                        placeholder={draft.englishTest === "IELTS" ? "6.5" : draft.englishTest === "Duolingo" ? "120" : "85"}
                        step={draft.englishTest === "IELTS" ? "0.5" : "1"}
                      />
                    </Field>
                    {draft.englishTest === "IELTS" && (
                      <Field label="Lowest band" hint="optional">
                        <NumberInput value={draft.englishMinBand} onChange={(v) => set({ englishMinBand: v })} placeholder="6.0" step="0.5" min={0} max={9} />
                      </Field>
                    )}
                  </div>
                )}

                {isMaster && (
                  <div className="space-y-4 border-t border-line pt-6">
                    <p className="text-sm font-medium text-ink">
                      GRE / GMAT <span className="font-normal text-faint">— optional, needed by some US/Singapore programs</span>
                    </p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="GRE Quant">
                        <NumberInput value={draft.greQuant} onChange={(v) => set({ greQuant: v })} placeholder="161" step="1" min={130} max={170} />
                      </Field>
                      <Field label="GRE Verbal">
                        <NumberInput value={draft.greVerbal} onChange={(v) => set({ greVerbal: v })} placeholder="152" step="1" min={130} max={170} />
                      </Field>
                      <Field label="GRE Writing">
                        <NumberInput value={draft.greAW} onChange={(v) => set({ greAW: v })} placeholder="3.5" step="0.5" min={0} max={6} />
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="GMAT" hint="optional">
                        <NumberInput value={draft.gmat} onChange={(v) => set({ gmat: v })} placeholder="650" step="10" min={200} max={800} />
                      </Field>
                      <Field label="Years of work experience" hint="can waive some GRE rules">
                        <NumberInput value={draft.yearsExperience} onChange={(v) => set({ yearsExperience: v })} placeholder="0" step="1" min={0} max={40} />
                      </Field>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <Button onClick={runMatch} withArrow>
                  See my matches
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — Results */}
          {step === 3 && result && (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="h2 text-ink">
                    {totalMatches > 0 ? (
                      <>
                        {totalMatches} program{totalMatches === 1 ? "" : "s"} for your profile
                      </>
                    ) : (
                      "No direct matches — but there are routes"
                    )}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    From {result.eligible.length + result.conditional.length + result.pathway.length + result.notEligibleCount} programs assessed
                    {result.notEligibleCount > 0 && ` · ${result.notEligibleCount} not a fit`}
                  </p>
                </div>
                <button onClick={restart} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink">
                  <RotateCcw className="h-4 w-4" /> Start over
                </button>
              </div>

              <SummaryBar result={result} />

              <Bucket
                title="Eligible"
                blurb="Your profile meets the published requirements for these programs. Stronger applications still benefit from a sharp SOP and early submission."
                matches={result.eligible}
              />
              <Bucket
                title="Conditional"
                blurb="Within reach with a small lift — a slightly higher score, a prerequisite, or supporting experience."
                matches={result.conditional}
              />
              <Bucket
                title="Pathway options"
                blurb="Not a direct match yet, but a recognised route gets you there. These are the gaps worth planning around."
                matches={result.pathway}
              />

              {totalMatches === 0 && (
                <div className="card p-8 text-center">
                  <p className="text-muted">
                    Nothing matched your filters directly. Try widening your preferred destinations or talk to a mentor — many
                    gaps have pathways that aren&apos;t obvious from scores alone.
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-ink-surface p-6 text-on-ink md:p-8">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 flex-none text-accent-bright" strokeWidth={1.75} />
                  <p className="text-sm leading-relaxed text-on-ink-muted">
                    These results are <span className="font-semibold text-on-ink">indicative</span>. Real admission and credential
                    assessment is done case by case by each university and varies by intake. Use this as a starting map — then let a
                    NextUp mentor confirm your shortlist and the exact requirements.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button href="/contact" variant="inverted" withArrow>
                    Review these with a mentor
                  </Button>
                  <Button href="/services" variant="ghost" className="text-on-ink hover:bg-white/10">
                    See how we help
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step < 3 && (
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-faint">
          <GraduationCap className="h-4 w-4" strokeWidth={1.75} />
          Private by design — your answers never leave your device.
        </p>
      )}
    </div>
  );
}
