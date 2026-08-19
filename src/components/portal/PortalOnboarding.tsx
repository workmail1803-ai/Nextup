"use client";

// =============================================================================
// PortalOnboarding — what a signed-in visitor with no file sees.
//
// This used to be a dead end ("we can't find your file"). It is now the funnel:
// a Google account answers three questions, books a mentor, and becomes a lead
// with a consultation already on the calendar.
//
// Everything writes through SECURITY DEFINER RPCs. The student never gets
// INSERT on `clients` or `appointments`, and their name/email come from the
// JWT, not the form — otherwise someone could type a real student's address and
// claim their file.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, CalendarCheck, Check, Loader2, MapPin, Users,
} from "lucide-react";
import { portalSupabase } from "@/lib/portal/supabase-portal";
import type { Session } from "@supabase/supabase-js";

interface Slot {
  mentor_id: string;
  mentor_name: string;
  mentor_title: string | null;
  mentor_avatar: string | null;
  slot_date: string;
  slot_start: string;
  slot_end: string;
  starts_at: string;
}

type Step = "about" | "mentor" | "slot" | "done";

const LEVELS = [
  { key: "bachelors", label: "Bachelor's" },
  { key: "masters", label: "Master's" },
];

function timeLabel(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function dayLabel(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export function PortalOnboarding({
  session, onComplete,
}: {
  session: Session | null;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<Step>("about");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(
    (session?.user?.user_metadata?.full_name as string) ??
      (session?.user?.user_metadata?.name as string) ??
      "",
  );
  const [level, setLevel] = useState<string | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Slot | null>(null);

  // Destinations come from the table an admin edits, not a hardcoded list — so
  // adding a country in the admin panel makes it appear here with no deploy.
  useEffect(() => {
    const t = setTimeout(() => {
      portalSupabase
        .from("destinations")
        .select("country")
        .order("country")
        .then(({ data }) => setDestinations((data ?? []).map((d) => d.country as string)));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const loadSlots = useCallback(async () => {
    const { data, error: e } = await portalSupabase.rpc("portal_available_slots", {
      p_days_ahead: 21,
    });
    if (e) throw e;
    setSlots((data as Slot[]) ?? []);
  }, []);

  async function createFile(): Promise<boolean> {
    const { error: e } = await portalSupabase.rpc("portal_create_file", {
      p_full_name: name.trim(),
      p_countries: countries.length ? countries : null,
      p_degree: level,
    });
    if (e) {
      setError(e.message);
      return false;
    }
    return true;
  }

  async function goToMentors() {
    setBusy(true);
    setError(null);
    try {
      if (!(await createFile())) return;
      await loadSlots();
      setStep("mentor");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function skipMentor() {
    setBusy(true);
    setError(null);
    try {
      if (await createFile()) onComplete();
    } finally {
      setBusy(false);
    }
  }

  async function book(slot: Slot) {
    setBusy(true);
    setError(null);
    try {
      const { error: e } = await portalSupabase.rpc("portal_book_meeting", {
        p_mentor_id: slot.mentor_id,
        p_starts_at: slot.starts_at,
      });
      if (e) {
        setError(e.message);
        // Someone may have taken it in the meantime — refresh so the list is honest.
        await loadSlots();
        return;
      }
      setChosen(slot);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't book that time.");
    } finally {
      setBusy(false);
    }
  }

  const mentors = Array.from(
    slots.reduce((m, s) => {
      if (!m.has(s.mentor_id)) m.set(s.mentor_id, s);
      return m;
    }, new Map<string, Slot>()).values(),
  );
  const mentorSlots = slots.filter((s) => s.mentor_id === mentorId);
  const byDate = mentorSlots.reduce((acc, s) => {
    (acc[s.slot_date] ??= []).push(s);
    return acc;
  }, {} as Record<string, Slot[]>);

  const canContinue = name.trim().length >= 2 && countries.length > 0 && !!level;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[640px] px-5 pb-16 pt-10">
      {/* ---------------------------------------------------------------- */}
      {step === "about" && (
        <>
          <p className="pf-label">New file</p>
          <h1 className="pf-display mt-3 text-[2.1rem]">Let&apos;s get you started.</h1>
          <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-relaxed" style={{ color: "var(--pf-vellum-2)" }}>
            Three quick questions, then you can book a call with one of our mentors — people who
            made this exact move themselves. It&apos;s free.
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <label htmlFor="ob-name" className="pf-label mb-1.5 block">Your name</label>
              <input
                id="ob-name"
                className="pf-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="As it appears on your passport"
              />
            </div>

            <div>
              <p className="pf-label mb-2">What are you applying for</p>
              <div className="flex gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.key}
                    className="pf-btn pf-press flex-1 py-2.5"
                    aria-pressed={level === l.key}
                    style={
                      level === l.key
                        ? { background: "var(--pf-seal-soft)", borderColor: "var(--pf-seal-line)", color: "var(--pf-seal)" }
                        : { borderColor: "var(--pf-rule-2)", color: "var(--pf-vellum-2)" }
                    }
                    onClick={() => setLevel(l.key)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="pf-label mb-2">Where you&apos;d like to go</p>
              <div className="flex flex-wrap gap-2">
                {destinations.map((c) => {
                  const on = countries.includes(c);
                  return (
                    <button
                      key={c}
                      className="pf-btn pf-press"
                      aria-pressed={on}
                      style={
                        on
                          ? { background: "var(--pf-seal-soft)", borderColor: "var(--pf-seal-line)", color: "var(--pf-seal)" }
                          : { borderColor: "var(--pf-rule-2)", color: "var(--pf-vellum-2)" }
                      }
                      onClick={() => setCountries((p) => (on ? p.filter((x) => x !== c) : [...p, c]))}
                    >
                      <MapPin className="h-3.5 w-3.5" /> {c}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--pf-vellum-3)" }}>
                Pick as many as you like — you can change this later.
              </p>
            </div>

            {error && <p className="text-sm" role="alert" style={{ color: "var(--pf-halt)" }}>{error}</p>}

            <button className="pf-btn pf-btn-seal pf-press w-full py-3" onClick={goToMentors} disabled={!canContinue || busy}>
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Setting up</> : <>Continue <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        </>
      )}

      {/* ---------------------------------------------------------------- */}
      {step === "mentor" && (
        <>
          <p className="pf-label">Step 2 of 3</p>
          <h1 className="pf-display mt-3 text-[2.1rem]">Who would you like to talk to?</h1>
          <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-relaxed" style={{ color: "var(--pf-vellum-2)" }}>
            A free 45-minute call. Bring your results and a rough budget — that&apos;s all you need.
          </p>

          {mentors.length === 0 ? (
            <div className="pf-panel mt-7 px-4 py-6">
              <p className="text-[0.9375rem]" style={{ color: "var(--pf-vellum-2)" }}>
                No mentor has open times in the next three weeks. Your file is created — a consultant
                will reach out to arrange a call directly.
              </p>
              <button className="pf-btn pf-btn-seal pf-press mt-4 w-full py-3" onClick={onComplete}>
                Go to my file
              </button>
            </div>
          ) : (
            <>
              <div className="mt-7 space-y-2">
                {mentors.map((m) => {
                  const count = slots.filter((s) => s.mentor_id === m.mentor_id).length;
                  return (
                    <button
                      key={m.mentor_id}
                      className="pf-panel pf-press flex w-full items-center gap-3.5 px-4 py-3.5 text-left"
                      style={mentorId === m.mentor_id ? { borderColor: "var(--pf-seal-line)" } : undefined}
                      onClick={() => {
                        setMentorId(m.mentor_id);
                        setStep("slot");
                      }}
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full pf-display text-[1rem]"
                        style={{ background: "var(--pf-ink-3)", color: "var(--pf-vellum-2)" }}
                      >
                        {m.mentor_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.9375rem] font-medium">{m.mentor_name}</span>
                        <span className="pf-mono block text-[0.6875rem]" style={{ color: "var(--pf-vellum-3)" }}>
                          {m.mentor_title || "NextUp mentor"} · {count} open {count === 1 ? "time" : "times"}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "var(--pf-vellum-3)" }} />
                    </button>
                  );
                })}
              </div>

              <button
                className="pf-press mt-7 flex w-full items-center justify-center gap-2 py-3 text-sm"
                style={{ color: "var(--pf-vellum-3)" }}
                onClick={skipMentor}
                disabled={busy}
              >
                I&apos;ll book later
              </button>
            </>
          )}
        </>
      )}

      {/* ---------------------------------------------------------------- */}
      {step === "slot" && (
        <>
          <button
            className="pf-press mb-5 inline-flex items-center gap-1.5 text-sm"
            style={{ color: "var(--pf-vellum-3)" }}
            onClick={() => setStep("mentor")}
          >
            <ArrowLeft className="h-4 w-4" /> Other mentors
          </button>

          <p className="pf-label">Step 3 of 3</p>
          <h1 className="pf-display mt-3 text-[2.1rem]">Pick a time.</h1>
          <p className="pf-mono mt-2 text-[0.8125rem]" style={{ color: "var(--pf-vellum-2)" }}>
            with {mentors.find((m) => m.mentor_id === mentorId)?.mentor_name} · Bangladesh time
          </p>

          {error && <p className="mt-4 text-sm" role="alert" style={{ color: "var(--pf-halt)" }}>{error}</p>}

          <div className="mt-6 space-y-5">
            {Object.entries(byDate).map(([date, list]) => (
              <div key={date}>
                <p className="pf-label mb-2">{dayLabel(date)}</p>
                <div className="flex flex-wrap gap-2">
                  {list.map((s) => (
                    <button
                      key={s.starts_at}
                      className="pf-btn pf-btn-quiet pf-press"
                      onClick={() => book(s)}
                      disabled={busy}
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      {timeLabel(s.slot_start)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ---------------------------------------------------------------- */}
      {step === "done" && chosen && (
        <div className="flex min-h-[70dvh] flex-col justify-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "var(--pf-approved-soft)", color: "var(--pf-approved)" }}
          >
            <CalendarCheck className="h-6 w-6" strokeWidth={1.9} />
          </div>
          <h1 className="pf-display mt-5 text-[2.1rem]">You&apos;re booked.</h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed" style={{ color: "var(--pf-vellum-2)" }}>
            {dayLabel(chosen.slot_date)} at {timeLabel(chosen.slot_start)} with {chosen.mentor_name}.
            It&apos;s in your file now, and your mentor has it too.
          </p>
          <button className="pf-btn pf-btn-seal pf-press mt-7 w-full py-3" onClick={onComplete}>
            <Check className="h-4 w-4" /> Go to my file
          </button>
        </div>
      )}

      {/* Progress, drawn in the same language as the file spine */}
      {step !== "done" && (
        <div className="mt-10 flex items-center gap-2" aria-hidden>
          {(["about", "mentor", "slot"] as Step[]).map((s, i) => {
            const idx = ["about", "mentor", "slot"].indexOf(step);
            return (
              <span
                key={s}
                className="h-px flex-1"
                style={{ background: i <= idx ? "var(--pf-seal)" : "var(--pf-rule)" }}
              />
            );
          })}
          <Users className="h-3.5 w-3.5" style={{ color: "var(--pf-vellum-3)" }} />
        </div>
      )}
    </div>
  );
}
