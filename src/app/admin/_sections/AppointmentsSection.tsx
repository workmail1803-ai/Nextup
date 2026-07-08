"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck, CalendarClock, Check, Mail, MessageCircle, Search, Trash2, X,
} from "lucide-react";
import { AppointmentService } from "@/lib/services/appointment.service";
import { StaffService } from "@/lib/services/staff.service";
import type { Staff } from "@/lib/types/staff";
import type { AppointmentStatus, AppointmentWithMentors } from "@/lib/types/scheduling";
import { WEEKDAYS_SHORT, formatSlot } from "@/lib/types/scheduling";
import { Badge, type Tone, input } from "./AdminUI";

const STATUS_TONE: Record<AppointmentStatus, Tone> = {
  pending: "amber", assigned: "blue", confirmed: "green", completed: "slate", cancelled: "red",
};
const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pending", assigned: "Assigned", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled",
};

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="text-2xl font-bold" style={{ color: tone }}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

export function AppointmentsSection() {
  const [rows, setRows] = useState<AppointmentWithMentors[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");

  const fetchAll = useCallback(async () => {
    try {
      const [a, s] = await Promise.all([AppointmentService.list(), StaffService.list()]);
      setRows(a);
      setStaff(s);
      setErr(null);
    } catch {
      setErr("Could not load appointments. Ensure migration 0006 has been applied.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const unsub = AppointmentService.subscribe(fetchAll);
    return unsub;
  }, [fetchAll]);

  const counts = useMemo(() => {
    const c = { pending: 0, assigned: 0, confirmed: 0 };
    rows.forEach((r) => { if (r.status in c) c[r.status as keyof typeof c]++; });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (r.name + " " + r.phone + " " + (r.interest ?? "")).toLowerCase().includes(q);
    });
  }, [rows, query, statusFilter]);

  async function assign(id: string, mentorId: string) {
    await AppointmentService.assign(id, mentorId || null);
    await fetchAll();
  }
  async function setStatus(id: string, status: AppointmentStatus) {
    await AppointmentService.update(id, { status });
    await fetchAll();
  }
  async function remove(id: string) {
    await AppointmentService.remove(id);
    await fetchAll();
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Appointments</h2>
        <p className="text-sm text-slate-400">Free consultation requests booked from the public website.</p>
      </div>

      {err && <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</div>}

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatTile label="Pending" value={counts.pending} tone="#f59e0b" />
        <StatTile label="Assigned" value={counts.assigned} tone="#60a5fa" />
        <StatTile label="Confirmed" value={counts.confirmed} tone="#4ade80" />
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className={`${input} pl-9`} placeholder="Search name, phone…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className={`${input} w-auto`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((s) => (<option key={s} value={s}>{STATUS_LABEL[s]}</option>))}
        </select>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-800/50 text-left text-xs font-semibold text-slate-400">
              <tr>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Interest</th>
                <th className="px-5 py-3">Requested slot</th>
                <th className="px-5 py-3">Mentor</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-700/40"><td colSpan={6} className="px-5 py-4"><div className="h-5 w-full animate-pulse rounded bg-slate-700/40" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-500">No appointments yet. They&apos;ll appear here the moment someone books from the website.</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-t border-slate-700/40 hover:bg-slate-800/30">
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{r.name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                        <a href={`https://wa.me/${r.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-green-400"><MessageCircle className="h-3 w-3" />{r.phone}</a>
                        {r.email && <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 hover:text-white"><Mail className="h-3 w-3" />email</a>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{r.interest || <span className="text-slate-600">—</span>}</td>
                    <td className="px-5 py-3">
                      {r.weekday != null ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-300">
                          <CalendarClock className="h-3.5 w-3.5 text-amber-400" />
                          {WEEKDAYS_SHORT[r.weekday]} · {formatSlot(r.slot_start, r.slot_end)}
                        </span>
                      ) : <span className="text-slate-600">Flexible</span>}
                      {r.preferred_mentor && <p className="mt-0.5 text-xs text-slate-500">Prefers {r.preferred_mentor.full_name}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <select className={`${input} w-40`} value={r.assigned_mentor_id ?? ""} onChange={(e) => assign(r.id, e.target.value)}>
                        <option value="">Unassigned (pool)</option>
                        {staff.map((s) => (<option key={s.id} value={s.id}>{s.full_name}</option>))}
                      </select>
                    </td>
                    <td className="px-5 py-3"><Badge label={STATUS_LABEL[r.status]} tone={STATUS_TONE[r.status]} /></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        {r.status !== "confirmed" && r.status !== "completed" && (
                          <button className="rounded-lg bg-green-500/10 p-2 text-green-400 hover:bg-green-500/20" title="Confirm" onClick={() => setStatus(r.id, "confirmed")}><CalendarCheck className="h-3.5 w-3.5" /></button>
                        )}
                        {r.status === "confirmed" && (
                          <button className="rounded-lg bg-slate-700/40 p-2 text-slate-300 hover:bg-slate-700/70 hover:text-white" title="Mark completed" onClick={() => setStatus(r.id, "completed")}><Check className="h-3.5 w-3.5" /></button>
                        )}
                        {r.status !== "cancelled" && (
                          <button className="rounded-lg bg-slate-700/40 p-2 text-slate-300 hover:bg-amber-500/20 hover:text-amber-400" title="Cancel" onClick={() => setStatus(r.id, "cancelled")}><X className="h-3.5 w-3.5" /></button>
                        )}
                        <button className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/25" title="Delete" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
