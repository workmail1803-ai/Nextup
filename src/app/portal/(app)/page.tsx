"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, FileCheck2, MapPin, Sparkles } from "lucide-react";
import { Avatar } from "@/components/internal";
import { JourneyStrip, JOURNEY } from "@/components/crm/JourneyStrip";
import { usePortal } from "@/lib/portal/PortalContext";
import type { ClientStage } from "@/lib/types/client";

/** Warm, plain-language framing of each stage — never internal jargon. */
const STAGE_COPY: Record<ClientStage, { title: string; body: string }> = {
  lead: { title: "Welcome aboard", body: "We have your details and we're getting your journey started." },
  meeting: { title: "Let's talk it through", body: "Your consultation is the next step — we'll map out your options together." },
  file_open: { title: "Building your file", body: "We're preparing your application documents. Keep an eye on your checklist." },
  offer: { title: "Chasing your offers", body: "Your applications are in. We're working to secure your university offers." },
  visa: { title: "Visa in progress", body: "The big step — we're guiding your visa file through to approval." },
  enrolled: { title: "You made it 🎉", body: "You're enrolled. Time to get ready for the move." },
  closed: { title: "Your file is closed", body: "Reach out to your consultant any time if you'd like to pick things back up." },
};

function nextMeeting(meetings: { scheduled_at: string | null; status: string }[]) {
  const now = Date.now();
  return meetings
    .filter((m) => m.scheduled_at && new Date(m.scheduled_at).getTime() > now && m.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0];
}

export default function PortalHome() {
  const { client, meetings, visa, mentor } = usePortal();
  if (!client) return null;

  const stage = client.stage;
  const copy = STAGE_COPY[stage];
  const step = stage === "closed" ? JOURNEY.length : JOURNEY.indexOf(stage) + 1;
  const upcoming = nextMeeting(meetings);
  const pendingDocs = visa?.documents.filter((d) => d.status === "pending").length ?? 0;

  return (
    <div className="space-y-4 px-4 py-5 sm:px-6">
      {/* Journey card — the hero */}
      <section className="crm-card p-5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--nx-accent-2)" }} />
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--nx-accent)" }}>
            {stage === "closed" ? "Journey complete" : `Step ${step} of ${JOURNEY.length}`}
          </span>
        </div>
        <h2 className="nx-display mt-2 text-2xl font-semibold leading-tight" style={{ color: "var(--nx-text)" }}>
          {copy.title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--nx-muted)" }}>
          {copy.body}
        </p>
        <JourneyStrip stage={stage} className="mt-4" />
        {client.country_interest?.length > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "var(--nx-faint)" }}>
            <MapPin className="h-3.5 w-3.5" /> Heading for {client.country_interest.join(" · ")}
          </p>
        )}
      </section>

      {/* Next meeting */}
      <Link href="/portal/meetings" className="crm-card crm-press block p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--nx-info-soft)", color: "var(--nx-info)" }}>
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: "var(--nx-faint)" }}>Next meeting</p>
            {upcoming ? (
              <p className="text-sm font-medium" style={{ color: "var(--nx-text)" }}>
                {new Date(upcoming.scheduled_at!).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            ) : (
              <p className="text-sm" style={{ color: "var(--nx-muted)" }}>Nothing scheduled yet</p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--nx-faint)" }} />
        </div>
      </Link>

      {/* Documents nudge */}
      <Link href="/portal/documents" className="crm-card crm-press block p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={
              pendingDocs > 0
                ? { background: "var(--nx-warning-soft)", color: "var(--nx-warning)" }
                : { background: "var(--nx-positive-soft)", color: "var(--nx-positive)" }
            }
          >
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: "var(--nx-faint)" }}>Documents</p>
            <p className="text-sm font-medium" style={{ color: "var(--nx-text)" }}>
              {!visa
                ? "Your checklist opens when your file does"
                : pendingDocs > 0
                  ? `${pendingDocs} still to sort out`
                  : "Everything's in — nice work"}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--nx-faint)" }} />
        </div>
      </Link>

      {/* Your team */}
      {mentor && (
        <section className="crm-card p-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: "var(--nx-faint)" }}>Your consultant</p>
          <div className="mt-2.5 flex items-center gap-3">
            <Avatar name={mentor.full_name} src={mentor.avatar_url} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--nx-text)" }}>{mentor.full_name}</p>
              <p className="text-xs" style={{ color: "var(--nx-faint)" }}>{mentor.title || "NextUp Mentor"}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
