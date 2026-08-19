"use client";

// =============================================================================
// BookForClient — staff booking a consultation on a client's behalf.
//
// Most students in this business arrive by WhatsApp or a walk-in, so the person
// taking the details books the call for them. Any staff member can do this,
// mentor or not; only mentors can be the subject of the booking.
//
// Reads the same free-slot function the student portal uses, so the two views
// of "what's available" cannot drift apart.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { useToast } from "@/components/internal";
import { Sheet } from "./Sheet";
import { staffSupabase } from "@/lib/auth/supabase-staff";

interface Slot {
  mentor_id: string;
  mentor_name: string;
  slot_date: string;
  slot_start: string;
  starts_at: string;
}

function timeLabel(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${period}`;
}

function dayLabel(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export function BookForClient({
  open, clientId, clientName, onClose, onBooked,
}: {
  open: boolean;
  clientId: string | null;
  clientName: string;
  onClose: () => void;
  onBooked: () => void;
}) {
  const toast = useToast();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await staffSupabase.rpc("portal_available_slots", { p_days_ahead: 21 });
    const rows = (data as Slot[]) ?? [];
    setSlots(rows);
    setMentorId((prev) => prev ?? rows[0]?.mentor_id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      load().catch(() => setLoading(false));
    }, 0);
    return () => clearTimeout(t);
  }, [open, load]);

  async function book(s: Slot) {
    if (!clientId) return;
    setBooking(s.starts_at);
    try {
      const { error } = await staffSupabase.rpc("staff_book_meeting", {
        p_client_id: clientId,
        p_mentor_id: s.mentor_id,
        p_starts_at: s.starts_at,
      });
      if (error) throw error;
      toast({
        title: "Consultation booked",
        description: `${clientName} with ${s.mentor_name}, ${dayLabel(s.slot_date)} ${timeLabel(s.slot_start)}`,
        tone: "success",
      });
      onBooked();
      onClose();
    } catch (err) {
      toast({
        title: "Couldn't book that",
        description: err instanceof Error ? err.message : String(err),
        tone: "error",
      });
      // Someone may have taken it — re-read so the list stops offering it.
      await load();
    } finally {
      setBooking(null);
    }
  }

  const mentors = Array.from(
    slots.reduce((m, s) => {
      if (!m.has(s.mentor_id)) m.set(s.mentor_id, s.mentor_name);
      return m;
    }, new Map<string, string>()).entries(),
  );
  const mine = slots.filter((s) => s.mentor_id === mentorId);
  const byDate = mine.reduce((acc, s) => {
    (acc[s.slot_date] ??= []).push(s);
    return acc;
  }, {} as Record<string, Slot[]>);

  return (
    <Sheet open={open} onClose={onClose} label={`Book a consultation for ${clientName}`}>
      <div className="space-y-5 p-5">
        <div>
          <h3 className="nx-display text-lg font-semibold" style={{ color: "var(--nx-text)" }}>
            Book a consultation
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--nx-muted)" }}>
            For {clientName}. Times are Bangladesh time.
          </p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="nx-skeleton h-11 rounded-xl" />
            ))}
          </div>
        ) : mentors.length === 0 ? (
          <div className="crm-card px-4 py-8 text-center">
            <p className="text-sm font-medium" style={{ color: "var(--nx-text)" }}>
              No mentor has free time
            </p>
            <p className="mt-1.5 text-xs" style={{ color: "var(--nx-faint)" }}>
              Either nobody is marked as a mentor yet, or every slot in the next three weeks is
              taken. An admin sets mentors in the Staff section; mentors set their own hours.
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="nx-label mb-2">Mentor</p>
              <div className="flex flex-wrap gap-2">
                {mentors.map(([id, name]) => (
                  <button
                    key={id}
                    className="crm-chip crm-press"
                    data-active={mentorId === id}
                    onClick={() => setMentorId(id)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(byDate).map(([date, list]) => (
                <div key={date}>
                  <p className="nx-label mb-1.5">{dayLabel(date)}</p>
                  <div className="flex flex-wrap gap-2">
                    {list.map((s) => (
                      <button
                        key={s.starts_at}
                        className="nx-btn nx-btn-ghost"
                        onClick={() => book(s)}
                        disabled={booking !== null}
                      >
                        {booking === s.starts_at ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CalendarPlus className="h-3.5 w-3.5" />
                        )}
                        {timeLabel(s.slot_start)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
