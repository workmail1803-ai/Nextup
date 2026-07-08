"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CalendarClock, Check, CheckCircle2, Loader2,
  Sparkles, Users,
} from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { AvailabilityService, type MentorWithSlots } from "@/lib/services/availability.service";
import { AppointmentService, DuplicatePhoneError } from "@/lib/services/appointment.service";
import { WEEKDAYS_SHORT, formatSlot } from "@/lib/types/scheduling";

const ease = [0.22, 1, 0.36, 1] as const;

interface Slot {
  weekday: number;
  start_time: string;
  end_time: string;
  key: string;
}

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? "?") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

function slotsOf(m: MentorWithSlots): Slot[] {
  return m.slots.map((s) => ({
    weekday: s.weekday,
    start_time: s.start_time,
    end_time: s.end_time,
    key: `${s.weekday}-${s.start_time}-${s.end_time}`,
  }));
}

export default function BookPage() {
  const [mentors, setMentors] = useState<MentorWithSlots[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(1);
  const [mentorId, setMentorId] = useState<string | "any" | null>(null);
  const [slotKey, setSlotKey] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", interest: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    AvailabilityService.listBookableMentors()
      .then(setMentors)
      .catch(() => setMentors([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedMentor = mentors.find((m) => m.id === mentorId) ?? null;

  // Slots to show: chosen mentor's, or the union of everyone's for "any".
  const slots: Slot[] = useMemo(() => {
    if (mentorId === "any") {
      const seen = new Map<string, Slot>();
      mentors.forEach((m) => slotsOf(m).forEach((s) => seen.set(s.key, s)));
      return [...seen.values()].sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time));
    }
    return selectedMentor ? slotsOf(selectedMentor) : [];
  }, [mentorId, mentors, selectedMentor]);

  const selectedSlot = slots.find((s) => s.key === slotKey) ?? null;

  async function submit() {
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await AppointmentService.create({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        interest: form.interest.trim() || null,
        preferred_mentor_id: mentorId === "any" || !mentorId ? null : mentorId,
        weekday: selectedSlot?.weekday ?? null,
        slot_start: selectedSlot?.start_time ?? null,
        slot_end: selectedSlot?.end_time ?? null,
      });
      setDone(true);
    } catch (e) {
      if (e instanceof DuplicatePhoneError) {
        setError("This phone number already has a booking with us. We'll be in touch — or call us directly.");
      } else {
        setError("Something went wrong. Please try again in a moment.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const steps = ["Mentor", "Time", "Details"];

  return (
    <>
      <section className="relative overflow-hidden bg-paper pt-32 pb-10 md:pt-40 md:pb-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-[-8%] h-[520px] w-[520px] rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(224,146,31,0.13) 0%, transparent 72%)" }}
        />
        <div className="container-edge max-w-3xl">
          <Reveal>
            <span className="eyebrow inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> Free · No account needed
            </span>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="display mt-5 text-balance text-ink">
              Book your <span className="accent-serif">free consultation</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lede mt-5 text-pretty">
              Pick a mentor and a time that suits you. Talk to someone who has actually
              studied in Europe — honest advice, zero pressure.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-paper pb-24">
        <div className="container-edge max-w-3xl">
          <div className="card overflow-hidden p-6 md:p-8">
            {done ? (
              <BookingDone name={form.name} />
            ) : (
              <>
                {/* Step indicator */}
                <div className="mb-8 flex items-center gap-2">
                  {steps.map((label, i) => {
                    const n = i + 1;
                    const active = step === n;
                    const complete = step > n;
                    return (
                      <div key={label} className="flex flex-1 items-center gap-2">
                        <span
                          className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                            active
                              ? "bg-accent text-white"
                              : complete
                                ? "bg-accent/15 text-accent"
                                : "bg-paper-2 text-faint"
                          }`}
                        >
                          {complete ? <Check className="h-4 w-4" /> : n}
                        </span>
                        <span className={`hidden text-sm font-medium sm:block ${active ? "text-ink" : "text-faint"}`}>
                          {label}
                        </span>
                        {i < steps.length - 1 && <span className="h-px flex-1 bg-line" />}
                      </div>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {/* Step 1 — mentor */}
                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28, ease }}>
                      <h2 className="font-display text-xl font-semibold text-ink">Choose your mentor</h2>
                      <p className="mt-1 text-sm text-muted">Or let us match you with the right one.</p>

                      {loading ? (
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-24 animate-pulse rounded-2xl bg-paper-2" />
                          ))}
                        </div>
                      ) : (
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                          {/* Any mentor */}
                          <MentorCard
                            selected={mentorId === "any"}
                            onClick={() => setMentorId("any")}
                            title="Any mentor"
                            subtitle="We'll match you to the best fit"
                            icon
                          />
                          {mentors.map((m) => (
                            <MentorCard
                              key={m.id}
                              selected={mentorId === m.id}
                              onClick={() => { setMentorId(m.id); setSlotKey(null); }}
                              title={m.full_name}
                              subtitle={m.title ?? "Mentor"}
                              initials={initials(m.full_name)}
                              days={[...new Set(m.slots.map((s) => s.weekday))].sort()}
                            />
                          ))}
                        </div>
                      )}

                      <div className="mt-8 flex justify-end">
                        <button
                          className="btn-next"
                          disabled={!mentorId}
                          onClick={() => setStep(2)}
                        >
                          Continue <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2 — slot */}
                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28, ease }}>
                      <h2 className="font-display text-xl font-semibold text-ink">Pick a time</h2>
                      <p className="mt-1 text-sm text-muted">
                        {mentorId === "any"
                          ? "Choose any slot — we'll assign an available mentor."
                          : `Available slots with ${selectedMentor?.full_name ?? "your mentor"}.`}
                      </p>

                      {slots.length === 0 ? (
                        <p className="mt-6 rounded-2xl bg-paper-2 px-4 py-6 text-center text-sm text-muted">
                          No preset slots — continue and we&apos;ll arrange a time that works for you.
                        </p>
                      ) : (
                        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                          {slots.map((s) => {
                            const sel = slotKey === s.key;
                            return (
                              <button
                                key={s.key}
                                onClick={() => setSlotKey(sel ? null : s.key)}
                                className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all ${
                                  sel ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-line-strong"
                                }`}
                              >
                                <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${sel ? "bg-accent text-white" : "bg-paper-2 text-accent"}`}>
                                  <CalendarClock className="h-5 w-5" />
                                </span>
                                <span>
                                  <span className="block font-semibold text-ink">{WEEKDAYS_SHORT[s.weekday]}</span>
                                  <span className="block text-sm text-muted">{formatSlot(s.start_time, s.end_time)}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-8 flex justify-between">
                        <button className="btn-back" onClick={() => setStep(1)}>
                          <ArrowLeft className="h-4 w-4" /> Back
                        </button>
                        <button className="btn-next" onClick={() => setStep(3)}>
                          Continue <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3 — details */}
                  {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28, ease }}>
                      <h2 className="font-display text-xl font-semibold text-ink">Your details</h2>
                      <p className="mt-1 text-sm text-muted">We&apos;ll confirm your free consultation on WhatsApp.</p>

                      {/* Summary chip */}
                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="chip">
                          {mentorId === "any" ? "Any mentor" : selectedMentor?.full_name}
                        </span>
                        {selectedSlot && (
                          <span className="chip">
                            {WEEKDAYS_SHORT[selectedSlot.weekday]} · {formatSlot(selectedSlot.start_time, selectedSlot.end_time)}
                          </span>
                        )}
                      </div>

                      <div className="mt-6 grid gap-4">
                        <Field label="Full name" required>
                          <input className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Phone (WhatsApp)" required>
                            <input className="field-input" value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); if (error) setError(null); }} placeholder="01XXXXXXXXX" inputMode="tel" />
                          </Field>
                          <Field label="Email (optional)">
                            <input className="field-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                          </Field>
                        </div>
                        <Field label="What do you want to study? (optional)">
                          <input className="field-input" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} placeholder="e.g. Master's in Italy, Bachelor's in Lithuania" />
                        </Field>
                      </div>

                      {error && (
                        <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
                          {error}
                        </p>
                      )}

                      <div className="mt-8 flex justify-between">
                        <button className="btn-back" onClick={() => setStep(2)} disabled={submitting}>
                          <ArrowLeft className="h-4 w-4" /> Back
                        </button>
                        <button className="btn-next" onClick={submit} disabled={submitting}>
                          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Booking…</> : <>Confirm free booking <Check className="h-4 w-4" /></>}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </section>

      <style>{`
        .btn-next { display:inline-flex; align-items:center; gap:.5rem; height:3rem; padding:0 1.5rem; border-radius:999px; background:var(--color-accent); color:#fff; font-weight:600; font-size:.95rem; transition:transform .18s var(--ease-out), opacity .18s; }
        .btn-next:hover:not(:disabled) { transform:translateY(-1px); }
        .btn-next:disabled { opacity:.45; cursor:not-allowed; }
        .btn-back { display:inline-flex; align-items:center; gap:.4rem; height:3rem; padding:0 1.25rem; border-radius:999px; border:1px solid var(--color-line-strong); color:var(--color-ink); font-weight:600; font-size:.95rem; transition:border-color .18s, color .18s; }
        .btn-back:hover:not(:disabled) { border-color:var(--color-accent); color:var(--color-accent); }
        .field-input { width:100%; border-radius:var(--radius); border:1px solid var(--color-line); background:var(--color-surface); padding:.75rem 1rem; color:var(--color-ink); font-size:.95rem; transition:border-color .18s, box-shadow .18s; }
        .field-input:focus { outline:none; border-color:var(--color-accent); box-shadow:0 0 0 3px rgba(168,90,26,.12); }
        .field-input::placeholder { color:var(--color-faint); }
      `}</style>
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      {children}
    </label>
  );
}

function MentorCard({
  selected, onClick, title, subtitle, initials, days, icon,
}: {
  selected: boolean; onClick: () => void; title: string; subtitle: string;
  initials?: string; days?: number[]; icon?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all ${
        selected ? "border-accent bg-accent-soft shadow-[var(--shadow-md)]" : "border-line bg-surface hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-sm)]"
      }`}
    >
      <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-full text-sm font-bold ${selected ? "bg-accent text-white" : "bg-accent-soft text-accent"}`}>
        {icon ? <Users className="h-5 w-5" /> : initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-ink">{title}</span>
          {selected && <CheckCircle2 className="h-4 w-4 text-accent" />}
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted">{subtitle}</span>
        {days && days.length > 0 && (
          <span className="mt-2 flex flex-wrap gap-1">
            {days.map((d) => (
              <span key={d} className="rounded-md bg-paper-2 px-1.5 py-0.5 text-[0.7rem] font-medium text-muted">
                {WEEKDAYS_SHORT[d]}
              </span>
            ))}
          </span>
        )}
      </span>
    </motion.button>
  );
}

function BookingDone({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease }}
      className="py-8 text-center"
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 14 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-positive/15 text-positive"
      >
        <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
      </motion.span>
      <h2 className="mt-6 font-display text-2xl font-semibold text-ink">You&apos;re booked{name ? `, ${name.split(" ")[0]}` : ""}!</h2>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Your free consultation request is in. A mentor will reach out on WhatsApp shortly to confirm the exact time.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-back">Back to home</Link>
        <Link href="/destinations/italy" className="btn-next">Explore destinations <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </motion.div>
  );
}
