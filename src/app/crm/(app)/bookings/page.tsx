"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, UserCheck, X } from "lucide-react";
import { Avatar, StatusBadge, useToast, type BadgeTone } from "@/components/internal";
import { Sheet } from "@/components/crm/Sheet";
import { AppointmentService } from "@/lib/services/appointment.service";
import { StaffService } from "@/lib/services/staff.service";
import {
  APPOINTMENT_STATUS_META, WEEKDAYS_LONG, WEEKDAYS_SHORT, formatSlot,
  type AppointmentStatus, type AppointmentWithMentors,
} from "@/lib/types/scheduling";
import type { Staff } from "@/lib/types/staff";

const STATUS_TONE: Record<AppointmentStatus, BadgeTone> = {
  pending: "warning",
  assigned: "info",
  confirmed: "accent",
  completed: "positive",
  cancelled: "neutral",
};

export default function BookingsPage() {
  const toast = useToast();
  const [appts, setAppts] = useState<AppointmentWithMentors[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppointmentWithMentors | null>(null);

  const load = useCallback(() => {
    Promise.all([AppointmentService.list(), StaffService.list()])
      .then(([a, s]) => {
        setAppts(a);
        setStaff(s.filter((x) => x.status === "active"));
      })
      .catch((err) =>
        toast({ title: "Couldn't load bookings", description: err instanceof Error ? err.message : String(err), tone: "error" }),
      )
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const needsMentor = useMemo(() => appts.filter((a) => a.status === "pending"), [appts]);

  const byWeekday = useMemo(() => {
    const active = appts.filter((a) => !["pending", "cancelled"].includes(a.status));
    const map = new Map<number, AppointmentWithMentors[]>();
    for (const a of active) {
      const day = a.weekday ?? (a.scheduled_at ? new Date(a.scheduled_at).getDay() : -1);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(a);
    }
    const today = new Date().getDay();
    // Start the week at today so “what's next” always leads.
    return [...map.entries()].sort(
      (a, b) => ((a[0] - today + 7) % 7) - ((b[0] - today + 7) % 7),
    );
  }, [appts]);

  async function assign(a: AppointmentWithMentors, mentorId: string) {
    try {
      await AppointmentService.assign(a.id, mentorId || null);
      toast({ title: mentorId ? "Mentor assigned" : "Assignment cleared", tone: "success" });
      setSelected(null);
      load();
    } catch (err) {
      toast({ title: "Couldn't assign", description: err instanceof Error ? err.message : String(err), tone: "error" });
    }
  }

  async function setStatus(a: AppointmentWithMentors, status: AppointmentStatus) {
    try {
      await AppointmentService.update(a.id, { status });
      toast({ title: `Marked ${APPOINTMENT_STATUS_META[status].label.toLowerCase()}`, tone: "success" });
      setSelected(null);
      load();
    } catch (err) {
      toast({ title: "Couldn't update", description: err instanceof Error ? err.message : String(err), tone: "error" });
    }
  }

  function Card({ a, first }: { a: AppointmentWithMentors; first: boolean }) {
    return (
      <div
        className="crm-row"
        role="button"
        tabIndex={0}
        style={first ? { borderRadius: 0 } : { borderTop: "1px solid var(--nx-edge)", borderRadius: 0 }}
        onClick={() => setSelected(a)}
        onKeyDown={(e) => e.key === "Enter" && setSelected(a)}
      >
        <div className="crm-num w-[4.8rem] shrink-0 text-[0.78rem] font-semibold" style={{ color: "var(--nx-accent-2)" }}>
          {formatSlot(a.slot_start, a.slot_end).split(" – ")[0] ||
            (a.scheduled_at
              ? new Date(a.scheduled_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
              : "—")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" style={{ color: "var(--nx-text)" }}>{a.name}</p>
          <p className="truncate text-xs" style={{ color: "var(--nx-faint)" }}>
            {a.interest || "General consultation"} · {a.assigned_mentor?.full_name ?? "Needs a mentor"}
          </p>
        </div>
        <StatusBadge label={APPOINTMENT_STATUS_META[a.status].label} tone={STATUS_TONE[a.status]} />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-5">
      {/* Needs a mentor */}
      <section className="px-4 sm:px-6">
        <h3 className="crm-section-title mb-2.5">
          Needs a mentor{needsMentor.length > 0 && <span style={{ color: "var(--nx-warning)" }}> · {needsMentor.length}</span>}
        </h3>
        <div className="crm-card overflow-hidden">
          {loading && <div className="nx-skeleton m-3 h-14 rounded-xl" />}
          {!loading && needsMentor.length === 0 && (
            <div className="flex items-center gap-3 px-4 py-5">
              <UserCheck className="h-5 w-5 shrink-0" style={{ color: "var(--nx-positive)" }} />
              <p className="text-sm" style={{ color: "var(--nx-muted)" }}>
                Every booking has a mentor. Nicely done.
              </p>
            </div>
          )}
          {!loading && needsMentor.map((a, i) => <Card key={a.id} a={a} first={i === 0} />)}
        </div>
      </section>

      {/* Weekly agenda, starting today */}
      <section className="px-4 sm:px-6">
        <h3 className="crm-section-title mb-2.5">This week</h3>
        {loading && <div className="nx-skeleton h-40 rounded-2xl" />}
        {!loading && byWeekday.length === 0 && (
          <div className="crm-card flex items-center gap-3 px-4 py-6">
            <CalendarClock className="h-5 w-5 shrink-0" style={{ color: "var(--nx-faint)" }} />
            <p className="text-sm" style={{ color: "var(--nx-muted)" }}>
              No confirmed bookings yet — assigned requests will land here.
            </p>
          </div>
        )}
        <div className="space-y-4">
          {byWeekday.map(([day, list]) => (
            <div key={day}>
              <p className="crm-num mb-1.5 text-xs font-bold" style={{ color: day === new Date().getDay() ? "var(--nx-accent-2)" : "var(--nx-faint)" }}>
                {day === new Date().getDay() ? "Today" : WEEKDAYS_LONG[day] ?? "Unscheduled"}
              </p>
              <div className="crm-card overflow-hidden">
                {list.map((a, i) => <Card key={a.id} a={a} first={i === 0} />)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking sheet */}
      <Sheet open={!!selected} onClose={() => setSelected(null)} label={selected ? `Booking for ${selected.name}` : "Booking"}>
        {selected && (
          <div className="space-y-5 pt-1">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="nx-display text-lg font-semibold" style={{ color: "var(--nx-text)" }}>
                  {selected.name}
                </h3>
                <StatusBadge label={APPOINTMENT_STATUS_META[selected.status].label} tone={STATUS_TONE[selected.status]} />
              </div>
              <p className="crm-num mt-1 text-sm" style={{ color: "var(--nx-muted)" }}>
                {selected.weekday != null ? `${WEEKDAYS_SHORT[selected.weekday]} · ` : ""}
                {formatSlot(selected.slot_start, selected.slot_end) || "No slot chosen"}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--nx-faint)" }}>
                {selected.phone}
                {selected.interest ? ` · ${selected.interest}` : ""}
              </p>
            </div>

            <section>
              <h4 className="crm-section-title mb-2">Mentor</h4>
              <div className="space-y-1.5">
                {staff.map((s) => {
                  const isAssigned = selected.assigned_mentor_id === s.id;
                  return (
                    <button
                      key={s.id}
                      className="crm-row crm-press w-full"
                      style={{
                        border: `1px solid ${isAssigned ? "var(--nx-accent-line)" : "var(--nx-edge)"}`,
                        background: isAssigned ? "var(--nx-accent-soft)" : "transparent",
                      }}
                      onClick={() => assign(selected, isAssigned ? "" : s.id)}
                    >
                      <Avatar name={s.full_name} src={s.avatar_url} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium" style={{ color: "var(--nx-text)" }}>
                        {s.full_name}
                      </span>
                      {isAssigned && <Check className="h-4 w-4" style={{ color: "var(--nx-accent-2)" }} />}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="flex gap-2">
              <button
                className="crm-chip crm-press flex-1 justify-center"
                style={{ height: "2.6rem", color: "var(--nx-positive)", borderColor: "rgba(70,177,125,0.35)", background: "var(--nx-positive-soft)" }}
                onClick={() => setStatus(selected, "completed")}
              >
                <Check className="h-4 w-4" /> Completed
              </button>
              <button
                className="crm-chip crm-press flex-1 justify-center"
                style={{ height: "2.6rem", color: "var(--nx-danger)", borderColor: "rgba(239,107,94,0.35)", background: "var(--nx-danger-soft)" }}
                onClick={() => setStatus(selected, "cancelled")}
              >
                <X className="h-4 w-4" /> Cancel booking
              </button>
            </section>
          </div>
        )}
      </Sheet>
    </div>
  );
}
