"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";
import { AvailabilityService } from "@/lib/services/availability.service";
import type { StaffAvailability } from "@/lib/types/scheduling";
import { WEEKDAYS_LONG, WEEKDAYS_SHORT, formatSlot } from "@/lib/types/scheduling";
import { AdminModal, btnGhost, btnPrimary, input, label } from "./AdminUI";

// Sat, Sun, Mon … order that matches how the team thinks about the week.
const DAY_ORDER = [6, 0, 1, 2, 3, 4, 5];

export function AvailabilityModal({
  staff, onClose,
}: {
  staff: { id: string; full_name: string } | null;
  onClose: () => void;
}) {
  const [slots, setSlots] = useState<StaffAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekday, setWeekday] = useState(6);
  const [start, setStart] = useState("17:00");
  const [end, setEnd] = useState("18:00");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!staff) return;
    setLoading(true);
    try {
      setSlots(await AvailabilityService.listForStaff(staff.id));
    } finally {
      setLoading(false);
    }
  }, [staff]);

  useEffect(() => {
    if (staff) load();
  }, [staff, load]);

  async function add() {
    if (!staff) return;
    if (end <= start) {
      setErr("End time must be after start time.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await AvailabilityService.add({ staff_id: staff.id, weekday, start_time: start, end_time: end });
      await load();
    } catch (e) {
      setErr((e as { code?: string })?.code === "23505" ? "That exact slot already exists." : "Could not add the slot.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await AvailabilityService.remove(id);
    await load();
  }

  const grouped = DAY_ORDER
    .map((d) => ({ day: d, items: slots.filter((s) => s.weekday === d) }))
    .filter((g) => g.items.length > 0);

  return (
    <AdminModal
      open={!!staff}
      wide
      title={
        <span className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-amber-400" /> Availability
        </span>
      }
      subtitle={staff ? `Weekly slots clients can book with ${staff.full_name}` : ""}
      onClose={onClose}
      footer={<button className={btnGhost} onClick={onClose}>Done</button>}
    >
      {/* Add slot */}
      <div className="mb-5 rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Add a slot</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-2">
            <label className={label}>Day</label>
            <select className={input} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
              {DAY_ORDER.map((d) => (<option key={d} value={d}>{WEEKDAYS_LONG[d]}</option>))}
            </select>
          </div>
          <div>
            <label className={label}>From</label>
            <input type="time" className={input} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className={label}>To</label>
            <input type="time" className={input} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
        <button className={`${btnPrimary} mt-3`} onClick={add} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add slot
        </button>
      </div>

      {/* Existing slots */}
      {loading ? (
        <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-500" /></div>
      ) : grouped.length === 0 ? (
        <p className="rounded-xl bg-slate-800/40 px-4 py-8 text-center text-sm text-slate-500">
          No availability yet. Add a slot above — it will appear on the public booking page.
        </p>
      ) : (
        <div className="space-y-3">
          {grouped.map((g) => (
            <div key={g.day}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{WEEKDAYS_LONG[g.day]}</p>
              <div className="flex flex-wrap gap-2">
                {g.items.map((s) => (
                  <span key={s.id} className="group inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/60 py-1.5 pl-3 pr-1.5 text-sm text-slate-200">
                    <span className="text-xs font-semibold text-amber-400">{WEEKDAYS_SHORT[s.weekday]}</span>
                    {formatSlot(s.start_time, s.end_time)}
                    <button onClick={() => remove(s.id)} className="rounded-full p-1 text-slate-400 hover:bg-red-500/20 hover:text-red-400" aria-label="Remove slot">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminModal>
  );
}
