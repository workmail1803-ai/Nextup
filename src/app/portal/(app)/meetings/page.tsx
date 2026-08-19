"use client";

import { useEffect, useState } from "react";
import { usePortal } from "@/lib/portal/PortalContext";
import type { ClientMeeting, MeetingStatus } from "@/lib/types/client";

/** Student-facing labels. Softer than the internal status names, and never
 *  blaming: an internal "no_show" reads as "Missed" here, not "You failed to attend". */
const MEETING_UI: Record<MeetingStatus, { label: string; tone: string }> = {
  scheduled: { label: "Booked", tone: "await" },
  completed: { label: "Done", tone: "approved" },
  no_show: { label: "Missed", tone: "halt" },
  follow_up: { label: "Follow-up", tone: "await" },
  cancelled: { label: "Cancelled", tone: "mute" },
};

export default function PortalMeetings() {
  const { meetings, mentor } = usePortal();

  // Read the clock off the render path so the split stays pure across hydration.
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

  const next = upcoming[0];

  return (
    <div className="px-5 pb-8 pt-7">
      <section>
        <p className="pf-label">Meetings</p>
        {next ? (
          <>
            <h1 className="pf-display mt-2.5 text-[1.9rem]">
              {new Date(next.scheduled_at!).toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </h1>
            <p className="pf-mono mt-2 text-[0.9375rem]" style={{ color: "var(--pf-vellum-2)" }}>
              {new Date(next.scheduled_at!).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              {mentor ? ` · with ${mentor.full_name}` : ""}
            </p>
            {next.comments && (
              <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-relaxed" style={{ color: "var(--pf-vellum-2)" }}>
                {next.comments}
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="pf-display mt-2.5 text-[1.9rem]">Nothing booked.</h1>
            <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-relaxed" style={{ color: "var(--pf-vellum-2)" }}>
              {meetings.length === 0
                ? "When your consultant books a session, the time and the joining details land here."
                : "No upcoming session right now. Your consultant will book the next one when it's needed."}
            </p>
          </>
        )}
      </section>

      {upcoming.length > 1 && (
        <section className="mt-7">
          <p className="pf-label mb-2.5">Also booked</p>
          <div className="pf-panel overflow-hidden">
            {upcoming.slice(1).map((m) => (
              <MeetingRow key={m.id} meeting={m} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-7">
          <p className="pf-label mb-2.5">Earlier</p>
          <div className="pf-panel overflow-hidden">
            {past.map((m) => (
              <MeetingRow key={m.id} meeting={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MeetingRow({ meeting }: { meeting: ClientMeeting }) {
  const ui = MEETING_UI[meeting.status];
  const d = meeting.scheduled_at ? new Date(meeting.scheduled_at) : null;
  return (
    <div className="pf-record">
      <span className="pf-mono w-[5.5rem] shrink-0 text-[0.75rem]" style={{ color: "var(--pf-vellum-2)" }}>
        {d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
      </span>
      <div className="min-w-0 flex-1">
        {meeting.follow_up_note ? (
          <p className="truncate text-[0.8125rem]" style={{ color: "var(--pf-vellum-2)" }}>
            {meeting.follow_up_note}
          </p>
        ) : (
          <p className="text-[0.8125rem]" style={{ color: "var(--pf-vellum-3)" }}>
            {d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "Time to be confirmed"}
          </p>
        )}
      </div>
      <span className="pf-status" data-tone={ui.tone}>
        {ui.label}
      </span>
    </div>
  );
}
