"use client";

// =============================================================================
// /crm/schedule — a mentor's own hours and consultation diary.
//
// Only mentors see this. The schedule half is editable, EXCEPT for windows a
// student has already booked into: those render locked, because the database
// refuses to change them (migration 0019). Showing a control that is guaranteed
// to fail is worse than showing none.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock, Lock, Plus, Trash2, Users, Loader2, CalendarDays, X,
} from "lucide-react";
import { useToast, Avatar, StatusBadge } from "@/components/internal";
import { useStaffAuth } from "@/lib/auth/StaffAuthContext";
import { AvailabilityService } from "@/lib/services/availability.service";
import { staffSupabase } from "@/lib/auth/supabase-staff";
import { MentorScheduleService, type MentorMeeting } from "@/lib/services/meeting.service";
import { WEEKDAYS_LONG, WEEKDAYS_SHORT, formatSlot, type StaffAvailability } from "@/lib/types/scheduling";
import { STAGE_META, type ClientStage } from "@/lib/types/client";

export default function MentorSchedulePage() {
  const { staff, isMentor, status } = useStaffAuth();
  const toast = useToast();

  const [slots, setSlots] = useState<StaffAvailability[]>([]);
  const [locks, setLocks] = useState<Record<string, number>>({});
  const [meetings, setMeetings] = useState<MentorMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  const [weekday, setWeekday] = useState(6);
  const [start, setStart] = useState("17:00");
  const [end, setEnd] = useState("17:45");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!staff?.id) return;
    const [mine, diary] = await Promise.all([
      AvailabilityService.listForStaff(staff.id),
      MentorScheduleService.upcoming(45),
    ]);
    setSlots(mine);
    setMeetings(diary);
    setLocks(await AvailabilityService.bookingCounts(mine.map((s) => s.id)));
    setLoading(false);
  }, [staff?.id]);

  useEffect(() => {
    if (!staff?.id) return;
    const t = setTimeout(() => {
      load().catch(() => setLoading(false));
    }, 0);
    return () => clearTimeout(t);
  }, [staff?.id, load]);

  const byDay = useMemo(
    () =>
      [0, 1, 2, 3, 4, 5, 6].map((d) => ({
        day: d,
        items: slots.filter((s) => s.weekday === d).sort((a, b) => a.start_time.localeCompare(b.start_time)),
      })),
    [slots],
  );

  if (status === "loading") {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--nx-faint)" }} />
      </div>
    );
  }

  if (!isMentor) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center px-6">
        <div className="crm-card w-full max-w-sm p-7 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "var(--nx-panel-2)", color: "var(--nx-faint)" }}
          >
            <CalendarClock className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <h1 className="nx-display mt-4 text-xl font-semibold" style={{ color: "var(--nx-text)" }}>
            Not a mentor account
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--nx-muted)" }}>
            Consultation hours are only for staff marked as mentors. An admin can change that from
            the Staff section.
          </p>
        </div>
      </div>
    );
  }

  async function add() {
    if (end <= start) {
      toast({ title: "End time must be after the start", tone: "error" });
      return;
    }
    setAdding(true);
    try {
      await AvailabilityService.add({ staff_id: staff!.id, weekday, start_time: start, end_time: end });
      await load();
      toast({ title: "Time added", description: `${WEEKDAYS_LONG[weekday]}, ${start}–${end}`, tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't add that",
        description: err instanceof Error ? err.message : String(err),
        tone: "error",
      });
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    try {
      await AvailabilityService.remove(id);
      await load();
      toast({ title: "Time removed", tone: "success" });
    } catch (err) {
      // The database guard speaks in plain language; pass it straight through.
      toast({
        title: "Can't remove that time",
        description: err instanceof Error ? err.message : String(err),
        tone: "error",
      });
    }
  }

  /** Cancelling is what releases a locked availability window — the guard in
   *  0019 tells a mentor to "cancel or move it first", so there has to be a way
   *  to do that. The row is marked cancelled, not deleted: a student who was
   *  given a time and then lost it is worth keeping a record of. */
  async function cancelMeeting(m: MentorMeeting) {
    const when = new Date(m.scheduled_at).toLocaleString("en-GB", {
      weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
    if (!confirm(`Cancel the consultation with ${m.client_name ?? "this client"} on ${when}?`)) return;
    try {
      const { error } = await staffSupabase.rpc("staff_cancel_meeting", {
        p_appointment_id: m.appointment_id,
      });
      if (error) throw error;
      await load();
      toast({ title: "Consultation cancelled", description: "That time is bookable again.", tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't cancel",
        description: err instanceof Error ? err.message : String(err),
        tone: "error",
      });
    }
  }

  const lockedTotal = Object.values(locks).filter((n) => n > 0).length;

  return (
    // pb-8 keeps the closing note clear of the floating mobile dock, which is
    // glass and would otherwise sit on top of it.
    <div className="space-y-6 pb-8 pt-5">
      <section className="px-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--nx-accent)" }}>
          Mentor
        </p>
        <h2 className="nx-display mt-1 text-[1.65rem] font-semibold leading-tight" style={{ color: "var(--nx-text)" }}>
          Your consultation hours
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--nx-muted)" }}>
          Students book directly into these. Times are Bangladesh time.
          {lockedTotal > 0 && ` ${lockedTotal} ${lockedTotal === 1 ? "is" : "are"} locked by a booking.`}
        </p>
      </section>

      {/* Upcoming consultations */}
      <section className="px-4 sm:px-6">
        <h3 className="crm-section-title mb-2.5">Your next consultations</h3>
        {loading ? (
          <div className="crm-card space-y-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="nx-skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div className="crm-card flex flex-col items-center px-6 py-10 text-center">
            <CalendarDays className="h-6 w-6" style={{ color: "var(--nx-faint)" }} />
            <p className="mt-3 text-sm font-medium" style={{ color: "var(--nx-text)" }}>
              Nothing booked yet
            </p>
            <p className="mt-1 max-w-xs text-xs" style={{ color: "var(--nx-faint)" }}>
              Add some hours below and students will be able to book them from their portal.
            </p>
          </div>
        ) : (
          <div className="crm-card overflow-hidden">
            {meetings.map((m, i) => {
              const d = new Date(m.scheduled_at);
              return (
                <div
                  key={m.appointment_id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={i === 0 ? undefined : { borderTop: "1px solid var(--nx-edge)" }}
                >
                  <div
                    className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl"
                    style={{ background: "var(--nx-accent-soft)", color: "var(--nx-accent-2)" }}
                  >
                    <span className="crm-num text-[0.58rem] font-semibold uppercase">
                      {d.toLocaleDateString("en-GB", { month: "short" })}
                    </span>
                    <span className="crm-num text-base font-bold leading-none">{d.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--nx-text)" }}>
                      {m.client_name ?? "Unnamed"}
                    </p>
                    <p className="crm-num truncate text-xs" style={{ color: "var(--nx-faint)" }}>
                      {d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      {m.countries?.length ? ` · ${m.countries.join(", ")}` : ""}
                    </p>
                  </div>
                  {m.client_stage && (
                    <StatusBadge
                      label={STAGE_META[m.client_stage as ClientStage]?.label ?? m.client_stage}
                      tone={STAGE_META[m.client_stage as ClientStage]?.tone ?? "neutral"}
                    />
                  )}
                  {m.client_id && (
                    <Link
                      href={`/crm/clients?open=${m.client_id}`}
                      className="shrink-0 text-xs font-semibold"
                      style={{ color: "var(--nx-accent-2)" }}
                    >
                      Open
                    </Link>
                  )}
                  <button
                    className="crm-press flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ color: "var(--nx-faint)" }}
                    onClick={() => cancelMeeting(m)}
                    aria-label="Cancel this consultation"
                    title="Cancel — frees the time for someone else"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add a window */}
      <section className="px-4 sm:px-6">
        <h3 className="crm-section-title mb-2.5">Add an available time</h3>
        <div className="crm-card flex flex-wrap items-end gap-3 p-4">
          <label className="flex-1 min-w-[9rem]">
            <span className="nx-label">Day</span>
            <select className="nx-input" value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
              {WEEKDAYS_LONG.map((d, i) => (
                <option key={d} value={i}>{d}</option>
              ))}
            </select>
          </label>
          <label className="min-w-[7rem] flex-1">
            <span className="nx-label">From</span>
            <input type="time" className="nx-input" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="min-w-[7rem] flex-1">
            <span className="nx-label">To</span>
            <input type="time" className="nx-input" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
          <button className="nx-btn nx-btn-primary" onClick={add} disabled={adding}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
          </button>
        </div>
      </section>

      {/* The week */}
      <section className="px-4 sm:px-6">
        <h3 className="crm-section-title mb-2.5">Your week</h3>
        <div className="crm-card divide-y" style={{ borderColor: "var(--nx-edge)" }}>
          {byDay.map(({ day, items }) => (
            <div key={day} className="flex items-start gap-3 px-4 py-3" style={{ borderColor: "var(--nx-edge)" }}>
              <span
                className="w-10 shrink-0 pt-1 text-xs font-semibold uppercase"
                style={{ color: items.length ? "var(--nx-accent-2)" : "var(--nx-faint)" }}
              >
                {WEEKDAYS_SHORT[day]}
              </span>
              {items.length === 0 ? (
                <span className="pt-1 text-xs" style={{ color: "var(--nx-faint)" }}>—</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {items.map((s) => {
                    const booked = locks[s.id] ?? 0;
                    return (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
                        style={{
                          background: booked ? "var(--nx-warning-soft)" : "var(--nx-panel-2)",
                          color: booked ? "var(--nx-warning)" : "var(--nx-muted)",
                          border: "1px solid var(--nx-edge)",
                        }}
                        title={
                          booked
                            ? `${booked} student${booked === 1 ? "" : "s"} booked — cancel the meeting first`
                            : undefined
                        }
                      >
                        <span className="crm-num">{formatSlot(s.start_time, s.end_time)}</span>
                        {booked > 0 ? (
                          <>
                            <Users className="h-3 w-3" />
                            {booked}
                            <Lock className="h-3 w-3" />
                          </>
                        ) : (
                          <button onClick={() => remove(s.id)} aria-label="Remove this time">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--nx-faint)" }}>
          A locked time has a student booked into it. Cancel or move their consultation first, then
          it becomes editable again.
        </p>
      </section>
    </div>
  );
}
