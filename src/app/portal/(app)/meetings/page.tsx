"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { StatusBadge, type BadgeTone } from "@/components/internal";
import { usePortal } from "@/lib/portal/PortalContext";
import type { ClientMeeting, MeetingStatus } from "@/lib/types/client";

/** Student-facing labels — softer than the internal status names. */
const MEETING_UI: Record<MeetingStatus, { label: string; tone: BadgeTone }> = {
  scheduled: { label: "Upcoming", tone: "info" },
  completed: { label: "Done", tone: "positive" },
  no_show: { label: "Missed", tone: "danger" },
  follow_up: { label: "Follow-up", tone: "warning" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export default function PortalMeetings() {
  const { meetings } = usePortal();
  // Captured off the render path so partitioning stays pure.
  const [now, setNow] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);

  const upcoming = meetings
    .filter((m) => m.scheduled_at && new Date(m.scheduled_at).getTime() > now && m.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());
  const past = meetings
    .filter((m) => !upcoming.includes(m))
    .sort((a, b) => new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime());

  return (
    <div className="space-y-5 px-4 py-5 sm:px-6">
      {meetings.length === 0 && (
        <div className="crm-card flex flex-col items-center px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--nx-accent-soft)", color: "var(--nx-accent-2)" }}>
            <CalendarDays className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <p className="mt-4 text-sm font-semibold" style={{ color: "var(--nx-text)" }}>No meetings yet</p>
          <p className="mt-1.5 max-w-xs text-sm" style={{ color: "var(--nx-faint)" }}>
            When your consultant books a session with you, it&apos;ll show up here with all the details.
          </p>
        </div>
      )}

      {upcoming.length > 0 && (
        <section>
          <h3 className="crm-section-title mb-2 px-1">Upcoming</h3>
          <div className="space-y-2">
            {upcoming.map((m) => (
              <MeetingCard key={m.id} meeting={m} highlight />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h3 className="crm-section-title mb-2 px-1">Past</h3>
          <div className="crm-card overflow-hidden">
            {past.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3" style={i === 0 ? undefined : { borderTop: "1px solid var(--nx-edge)" }}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--nx-text)" }}>
                    {m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Unscheduled"}
                  </p>
                  {m.follow_up_note && <p className="mt-0.5 truncate text-xs" style={{ color: "var(--nx-faint)" }}>{m.follow_up_note}</p>}
                </div>
                <StatusBadge label={MEETING_UI[m.status].label} tone={MEETING_UI[m.status].tone} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MeetingCard({ meeting, highlight }: { meeting: ClientMeeting; highlight?: boolean }) {
  const d = meeting.scheduled_at ? new Date(meeting.scheduled_at) : null;
  return (
    <div className="crm-card p-4" style={highlight ? { borderColor: "var(--nx-accent-line)" } : undefined}>
      <div className="flex items-center gap-3.5">
        <div
          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
          style={{ background: "var(--nx-accent-soft)", color: "var(--nx-accent-2)" }}
        >
          <span className="crm-num text-[0.6rem] font-semibold uppercase">{d ? d.toLocaleDateString("en-GB", { month: "short" }) : "—"}</span>
          <span className="crm-num text-lg font-bold leading-none">{d ? d.getDate() : "?"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--nx-text)" }}>
            {d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "Time to be confirmed"}
          </p>
          <p className="text-xs" style={{ color: "var(--nx-faint)" }}>
            {d ? d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "Your consultant will confirm the date"}
          </p>
        </div>
        <StatusBadge label={MEETING_UI[meeting.status].label} tone={MEETING_UI[meeting.status].tone} />
      </div>
      {meeting.comments && (
        <p className="mt-3 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--nx-panel-2)", color: "var(--nx-muted)" }}>
          {meeting.comments}
        </p>
      )}
    </div>
  );
}
