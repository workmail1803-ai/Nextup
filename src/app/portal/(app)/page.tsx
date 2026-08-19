"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usePortal } from "@/lib/portal/PortalContext";
import type { ClientStage } from "@/lib/types/client";

// -----------------------------------------------------------------------------
// The six stages of a file. `closed` is not a stage — it is a state the whole
// file can be in — so it is handled separately rather than tacked on the end.
// -----------------------------------------------------------------------------
const STAGES: { key: ClientStage; name: string }[] = [
  { key: "lead", name: "Enquiry received" },
  { key: "meeting", name: "Consultation" },
  { key: "file_open", name: "File opened" },
  { key: "offer", name: "University offer" },
  { key: "visa", name: "Visa lodged" },
  { key: "enrolled", name: "Departure" },
];

/** Who the file is genuinely sitting with. The one thing a waiting student
 *  actually wants to know, so it is never buried in prose. */
type Holder = "you" | "us" | "university" | "embassy" | "nobody";

const HOLDER_LABEL: Record<Holder, string> = {
  you: "You",
  us: "Your consultant",
  university: "The universities",
  embassy: "The embassy",
  nobody: "—",
};

function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PortalFile() {
  const { client, meetings, visa, stageEvents, benchmark } = usePortal();

  // The clock is read off the render path: calling Date.now() during render is
  // impure and makes the server and client disagree about what is "upcoming".
  const [now, setNow] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);

  if (!client) return null;

  const stage = client.stage;
  const closed = stage === "closed";
  const currentIndex = closed ? STAGES.length : STAGES.findIndex((s) => s.key === stage);

  const pendingDocs = visa?.documents.filter((d) => d.status === "pending").length ?? 0;
  const nextMeeting = meetings
    .filter((m) => m.scheduled_at && new Date(m.scheduled_at).getTime() > now && m.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0];

  // --- The one statement, and who holds the file -----------------------------
  let statement: string;
  let detail: string;
  let holder: Holder;

  if (closed) {
    statement = "This file is closed.";
    detail = "Message your consultant any time if you want to pick it back up.";
    holder = "nobody";
  } else if (stage === "lead") {
    statement = "Your file is open.";
    detail = "We have your details. Your consultant will be in touch to arrange a first call.";
    holder = "us";
  } else if (stage === "meeting") {
    statement = nextMeeting ? "Your consultation is booked." : "A consultation is next.";
    detail = nextMeeting
      ? "Bring your results and a rough budget — that is all you need for the first call."
      : "Your consultant will confirm a time with you shortly.";
    holder = nextMeeting ? "you" : "us";
  } else if (stage === "file_open") {
    statement = "We're building your application.";
    detail =
      pendingDocs > 0
        ? "Your consultant is preparing the paperwork. A few documents still have to come from you."
        : "Your consultant is preparing and checking the paperwork. Nothing needed from you.";
    holder = pendingDocs > 0 ? "you" : "us";
  } else if (stage === "offer") {
    statement = "Your applications are in.";
    detail = "They sit with the universities now. Decisions usually take a few weeks, and we chase them.";
    holder = "university";
  } else if (stage === "visa") {
    const appt = fmtDate(visa?.vfs_appointment_date);
    statement = "Your file is with the embassy.";
    // The appointment date belongs here, not on the timeline entry — it is a
    // date in the future, and a student reading it next to a completed-looking
    // marker would think the visa had already been lodged.
    detail = [
      pendingDocs > 0
        ? "A few documents still have to come from you before the file is complete."
        : "Embassy decisions run to their own clock. We will tell you the moment it moves.",
      appt ? `Your appointment is on ${appt}.` : null,
    ]
      .filter(Boolean)
      .join(" ");
    holder = pendingDocs > 0 ? "you" : "embassy";
  } else {
    statement = "You're enrolled.";
    detail = "The hard part is done. Next comes accommodation, travel and arrival.";
    holder = "you";
  }

  // --- Dates we can actually prove. No invented history. ---------------------
  const consultationDate = meetings
    .filter((m) => m.status === "completed" && m.scheduled_at)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0]?.scheduled_at;

  // Only dates that record something that ACTUALLY HAPPENED. The schema keeps no
  // stage history, so most entries have none — a dash is honest, an invented
  // date is not, and this is read by someone anxious enough to check nightly.
  const stageDate = (key: ClientStage): string | null => {
    if (key === "lead") return fmtDate(client.created_at);
    if (key === "meeting") return fmtDate(consultationDate);
    return null;
  };

  const progressPct = currentIndex <= 0 ? 0 : (currentIndex / (STAGES.length - 1)) * 100;

  return (
    <div className="px-5 pb-8 pt-7">
      {/* The statement */}
      <section>
        <p className="pf-label">
          {closed ? "Closed" : `Stage ${currentIndex + 1} of ${STAGES.length}`}
        </p>
        <h1 className="pf-display mt-2.5 text-[2rem] sm:text-[2.35rem]">{statement}</h1>
        <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-relaxed" style={{ color: "var(--pf-vellum-2)" }}>
          {detail}
        </p>
      </section>

      {/* Who holds the file. The question every student is actually asking. */}
      <section
        className="mt-6 flex items-center gap-3 border-y py-3.5"
        style={{ borderColor: "var(--pf-rule)" }}
      >
        <span className="pf-label">Waiting on</span>
        <span
          className="pf-mono text-[0.8125rem] font-medium"
          style={{ color: holder === "you" ? "var(--pf-await)" : "var(--pf-vellum)" }}
        >
          {HOLDER_LABEL[holder]}
        </span>
        {holder === "you" && pendingDocs > 0 && (
          <Link
            href="/portal/documents"
            className="pf-btn pf-btn-seal pf-press ml-auto"
          >
            {pendingDocs} to send <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
        {holder === "you" && pendingDocs === 0 && nextMeeting && (
          <Link href="/portal/meetings" className="pf-btn pf-btn-quiet pf-press ml-auto">
            See the time <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </section>

      {/* How long this has been going, and what normal looks like.
          The whole point of the feature: unbounded waiting is what frightens
          people, a bounded range does not. Every element here is suppressed
          unless the data genuinely supports it. */}
      <WaitingPanel
        stageEvents={stageEvents}
        stage={stage}
        benchmark={benchmark}
        now={now}
        closed={closed}
      />

      {/* The spine */}
      <section className="mt-7">
        <p className="pf-label mb-3">The file so far</p>
        <div
          className="pf-spine"
          style={{ ["--pf-spine-progress" as string]: `${progressPct}%` }}
        >
          {STAGES.map((s, i) => {
            const state = i < currentIndex ? "done" : i === currentIndex ? "now" : "todo";
            const date = state === "todo" ? null : stageDate(s.key);
            return (
              <div
                key={s.key}
                className="pf-entry"
                data-state={state}
                style={{ animationDelay: `${180 + i * 90}ms` }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="pf-entry-name">{s.name}</span>
                  <span className="pf-mono text-[0.6875rem]" style={{ color: "var(--pf-vellum-3)" }}>
                    {date ?? (state === "now" ? "in progress" : "—")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/**
 * Shows "day N in this stage" and, when the evidence supports it, the range
 * other students have seen.
 *
 * Deliberately silent when:
 *   - the stage entry is `inferred` (rebuilt from updated_at, so the day count
 *     would be a guess dressed as a measurement)
 *   - the benchmark RPC returns nothing (too few files, or degenerate data)
 *   - the file is closed, where elapsed time means nothing
 */
function WaitingPanel({
  stageEvents, stage, benchmark, now, closed,
}: {
  stageEvents: { to_stage: string; occurred_at: string; source: "recorded" | "inferred" }[];
  stage: string;
  benchmark: { sample_size: number; p25_days: number; median_days: number; p75_days: number } | null;
  now: number;
  closed: boolean;
}) {
  if (closed || now === 0) return null;

  const entry = [...stageEvents]
    .filter((e) => e.to_stage === stage)
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0];

  // No recorded entry means no honest day count. Say nothing rather than guess.
  if (!entry || entry.source !== "recorded") return null;

  const days = Math.max(0, Math.floor((now - new Date(entry.occurred_at).getTime()) / 86_400_000));

  return (
    <section className="mt-6">
      <div className="pf-panel px-4 py-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="pf-label">In this stage</span>
          <span className="pf-mono text-[0.8125rem]" style={{ color: "var(--pf-vellum)" }}>
            {days === 0 ? "since today" : `day ${days}`}
          </span>
        </div>

        {benchmark ? (
          <>
            <p className="mt-2.5 text-[0.875rem] leading-relaxed" style={{ color: "var(--pf-vellum-2)" }}>
              Students at this point usually move on between{" "}
              <span className="pf-mono" style={{ color: "var(--pf-vellum)" }}>
                {benchmark.p25_days}
              </span>{" "}
              and{" "}
              <span className="pf-mono" style={{ color: "var(--pf-vellum)" }}>
                {benchmark.p75_days}
              </span>{" "}
              days.
            </p>
            {/* Sample size is shown, not hidden. A range from 6 files and a range
                from 600 deserve different amounts of trust, and the reader is
                entitled to tell them apart. */}
            <p className="pf-mono mt-1.5 text-[0.6875rem]" style={{ color: "var(--pf-vellum-3)" }}>
              from {benchmark.sample_size} past {benchmark.sample_size === 1 ? "file" : "files"} · median{" "}
              {benchmark.median_days}d
            </p>
          </>
        ) : (
          <p className="mt-2.5 text-[0.875rem] leading-relaxed" style={{ color: "var(--pf-vellum-2)" }}>
            We don&apos;t have enough past files at this stage to give you a reliable
            range yet. Your consultant can tell you what to expect.
          </p>
        )}
      </div>
    </section>
  );
}
