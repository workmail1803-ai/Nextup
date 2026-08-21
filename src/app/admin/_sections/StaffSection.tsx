"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock, Clock, KeyRound, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, UserRound, Users,
} from "lucide-react";
import { AvailabilityModal } from "./AvailabilityModal";
import { StaffService, generateStaffCode } from "@/lib/services/staff.service";
import { staffSupabase } from "@/lib/auth/supabase-staff";
import { AttendanceService } from "@/lib/services/attendance.service";
import type { Staff, StaffStatus } from "@/lib/types/staff";
import type { AttendanceSession } from "@/lib/types/attendance";
import { formatHm, sessionMinutes } from "@/lib/attendance/compute";
import { AdminModal, Badge, btnDanger, btnGhost, btnPrimary, input, label } from "./AdminUI";

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? "?") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

function StatTile({ icon: Icon, label: l, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="admin-card rounded-xl px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xl font-semibold text-[var(--ad-text)]">{value}</p>
          <p className="text-[11px] text-[var(--ad-text-tertiary)]">{l}</p>
        </div>
      </div>
    </div>
  );
}

interface FormState {
  id?: string;
  full_name: string;
  title: string;
  staff_code: string;
  status: StaffStatus;
  /** Sign-in identity. Required on create — without it the person has a record
   *  but no way in, which is how every account until now had to be made by hand. */
  email: string;
  password: string;
  role: "admin" | "staff";
  is_mentor: boolean;
}

const EMPTY_FORM: FormState = {
  full_name: "", title: "", staff_code: "", status: "active",
  email: "", password: "", role: "staff", is_mentor: false,
};

/**
 * Passwords a person has to read off a screen and type on a phone. Excludes
 * l/1/I/O/0 and anything needing a shift chord — the admin password generated
 * earlier was rejected repeatedly by a colleague purely because it contained a
 * lowercase L next to digits.
 */
function suggestPassword(): string {
  const words = ["harbour", "lantern", "meadow", "compass", "ginger", "rocket",
                 "velvet", "cobalt", "summit", "pebble", "tundra", "quartz"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(Math.random() * 90) + 10;
  return `${pick()}-${pick()}-${n}`;
}

export function StaffSection() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [today, setToday] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StaffStatus>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Staff | null>(null);
  const [availabilityStaff, setAvailabilityStaff] = useState<Staff | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([StaffService.list(), AttendanceService.todayAll()]);
      setStaff(s);
      setToday(t);
      setErr(null);
    } catch {
      setErr("Could not load staff. Ensure migration 0001 has been applied.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const unsub = AttendanceService.subscribeAll(fetchAll); // any attendance change refetches
    return unsub;
  }, [fetchAll]);

  // today attendance rolled up per staff
  const byStaff = useMemo(() => {
    const map = new Map<string, { minutes: number; active: boolean }>();
    for (const s of today) {
      const cur = map.get(s.staff_id) ?? { minutes: 0, active: false };
      cur.minutes += sessionMinutes(s);
      if (s.status === "working") cur.active = true;
      map.set(s.staff_id, cur);
    }
    return map;
  }, [today]);

  const board = useMemo(() => {
    let workingNow = 0;
    let workedToday = 0;
    let minutes = 0;
    for (const [, v] of byStaff) {
      if (v.active) workingNow++;
      if (v.minutes > 0) workedToday++;
      minutes += v.minutes;
    }
    return { total: staff.length, workingNow, workedToday, minutes };
  }, [byStaff, staff.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (s.full_name + " " + s.staff_code + " " + (s.title ?? "")).toLowerCase().includes(q);
    });
  }, [staff, query, statusFilter]);

  function openCreate() {
    setForm({ ...EMPTY_FORM, staff_code: generateStaffCode() });
    setModalOpen(true);
  }
  function openEdit(s: Staff) {
    setForm({ id: s.id, full_name: s.full_name, title: s.title ?? "", staff_code: s.staff_code,
              status: s.status, email: s.email ?? "", password: "",
              role: s.role ?? "staff", is_mentor: !!s.is_mentor });
    setModalOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.staff_code.trim()) return;
    setSaving(true);
    try {
      if (form.id) {
        await StaffService.update(form.id, {
          full_name: form.full_name.trim(),
          title: form.title.trim() || null,
          staff_code: form.staff_code.trim().toUpperCase(),
          status: form.status,
          role: form.role,
          is_mentor: form.is_mentor,
        });
      } else {
        // Creating a login needs the Admin API and the service key, which the
        // browser must never hold — so this goes through a server route that
        // re-checks the caller is an admin before it touches anything.
        const { data: sess } = await staffSupabase.auth.getSession();
        const res = await fetch("/api/admin/staff", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
          },
          body: JSON.stringify({
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
            title: form.title.trim() || null,
            staff_code: form.staff_code.trim().toUpperCase() || undefined,
            is_mentor: form.is_mentor,
          }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error ?? "Could not create the account.");
      }
      setModalOpen(false);
      await fetchAll();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setErr(msg.includes("duplicate") ? "That staff code is already taken." : msg);
    } finally {
      setSaving(false);
    }
  }

  /** Mentor is a capability, not a rank — an admin may mentor, a staff member
   *  may not. Untick and they vanish from the student-facing list immediately
   *  (public_mentors is filtered on it), though already-booked calls stand. */
  async function toggleMentor(s: Staff) {
    setBusyId(s.id);
    try {
      await StaffService.update(s.id, { is_mentor: !s.is_mentor });
      await fetchAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(s: Staff) {
    setBusyId(s.id);
    try {
      await StaffService.update(s.id, { status: s.status === "active" ? "disabled" : "active" });
      await fetchAll();
    } finally {
      setBusyId(null);
    }
  }

  async function resetCode(s: Staff) {
    setBusyId(s.id);
    try {
      await StaffService.update(s.id, { staff_code: generateStaffCode() });
      await fetchAll();
    } finally {
      setBusyId(null);
    }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    setBusyId(confirmDelete.id);
    try {
      await StaffService.remove(confirmDelete.id);
      setConfirmDelete(null);
      await fetchAll();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--ad-text)]">Staff Management</h2>
          <p className="text-[12px] text-[var(--ad-text-tertiary)]">Create staff, assign codes, and track attendance in real time.</p>
        </div>
        <button className={btnPrimary} onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Staff
        </button>
      </div>

      {err && (
        <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {err}
        </div>
      )}

      {/* Live board */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Users} label="Total staff" value={board.total} />
        <StatTile icon={UserRound} label="Working now" value={board.workingNow} />
        <StatTile icon={Clock} label="Worked today" value={board.workedToday} />
        <StatTile icon={Clock} label="Hours today" value={formatHm(board.minutes)} />
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className={`${input} pl-9`} placeholder="Search name, code…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {(["all", "active", "disabled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${
                statusFilter === f ? "bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]" : "bg-[var(--ad-surface)] text-[var(--ad-text-tertiary)] hover:text-[var(--ad-text-secondary)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead className="text-left text-[11px] font-medium text-[var(--ad-text-tertiary)]" style={{ background: "var(--ad-bg-raised)" }}>
              <tr>
                <th className="px-5 py-3">Staff</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Mentor</th>
                <th className="px-5 py-3">Today</th>
                <th className="px-5 py-3">Session</th>
                <th className="px-5 py-3">Last login</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-[var(--ad-border)]">
                    <td colSpan={8} className="px-5 py-4">
                      <div className="h-5 w-full animate-pulse rounded bg-[var(--ad-surface-hover)]" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                   <td colSpan={8} className="px-5 py-14 text-center text-[var(--ad-text-quaternary)] text-[13px]">
                    No staff found. Click “Add Staff” to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const att = byStaff.get(s.id);
                  return (
                    <tr key={s.id} className="border-t border-[var(--ad-border)] hover:bg-[var(--ad-surface-hover)]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {/* The photo staff set themselves in the CRM. Initials
                              stay as the fallback so a missing one is never a gap. */}
                          {s.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.avatar_url}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ad-accent-muted)] text-[11px] font-semibold text-[var(--ad-accent)]">
                              {initials(s.full_name)}
                            </span>
                          )}
                          <div>
                            <p className="font-medium text-[var(--ad-text)] text-[13px]">{s.full_name}</p>
                            <p className="text-[11px] text-[var(--ad-text-quaternary)]">{s.title ?? "Staff"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-[var(--ad-text-secondary)] text-[12px]">{s.staff_code}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => toggleStatus(s)} disabled={busyId === s.id} title="Toggle status">
                          <Badge label={s.status === "active" ? "Active" : "Disabled"} tone={s.status === "active" ? "green" : "slate"} />
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleMentor(s)}
                          disabled={busyId === s.id}
                          title={s.is_mentor ? "Remove from the student mentor list" : "Let students book consultations with them"}
                        >
                          <Badge label={s.is_mentor ? "Mentor" : "—"} tone={s.is_mentor ? "amber" : "slate"} />
                        </button>
                      </td>
                      <td className="px-5 py-3 font-medium text-[var(--ad-text)]">{formatHm(att?.minutes ?? 0)}</td>
                      <td className="px-5 py-3">
                        {att?.active ? <Badge label="Working" tone="green" dot pulse /> : <span className="text-[var(--ad-text-quaternary)]">—</span>}
                      </td>
                      <td className="px-5 py-3 text-[var(--ad-text-tertiary)] text-[12px]">
                        {s.last_login_at ? new Date(s.last_login_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button className="rounded-md p-1.5 text-[var(--ad-text-tertiary)] hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text)]" title="Availability" onClick={() => setAvailabilityStaff(s)}>
                            <CalendarClock className="h-3.5 w-3.5" />
                          </button>
                          <button className="rounded-md p-1.5 text-[var(--ad-text-tertiary)] hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text)]" title="Edit" onClick={() => openEdit(s)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button className="rounded-md p-1.5 text-[var(--ad-text-tertiary)] hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text)] disabled:opacity-50" title="Reset code" onClick={() => resetCode(s)} disabled={busyId === s.id}>
                            {busyId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                          </button>
                          <button className="rounded-md p-1.5 text-red-400 hover:bg-red-500/10" title="Delete" onClick={() => setConfirmDelete(s)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit modal */}
      <AdminModal
        open={modalOpen}
        title={form.id ? "Edit staff" : "Add staff"}
        subtitle={form.id ? "Update details or reset the code." : "They’ll sign in at /staff_portal with this code."}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className={btnGhost} onClick={() => setModalOpen(false)}>Cancel</button>
            <button className={btnPrimary} onClick={save} disabled={saving} form="staff-form" type="submit">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save
            </button>
          </>
        }
      >
        <form id="staff-form" onSubmit={save} className="space-y-4">
          <div>
            <label className={label}>Full name</label>
            <input className={input} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} autoFocus required />
          </div>
          <div>
            <label className={label}>Title / role</label>
            <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Visa Specialist" />
          </div>
          <div>
            <label className={label}>Staff code</label>
            <div className="flex gap-2">
              <input className={`${input} font-mono uppercase`} value={form.staff_code} onChange={(e) => setForm({ ...form, staff_code: e.target.value.toUpperCase() })} required />
              <button type="button" className={btnGhost} onClick={() => setForm({ ...form, staff_code: generateStaffCode() })} title="Generate">
                <KeyRound className="h-4 w-4" /> Generate
              </button>
            </div>
          </div>
          <div>
            <label className={label}>Email (this is their username)</label>
            <input
              className={input}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@nextupmentor.com"
              disabled={!!form.id}
              required={!form.id}
            />
            <p className="mt-1 text-[11px] text-[var(--ad-text-quaternary)]">
              {form.id
                ? "Changing a sign-in address would unlink their account, so it is fixed here."
                : "They sign in with the part before the @ if it is a nextupmentor.com address."}
            </p>
          </div>

          {!form.id && (
            <div>
              <label className={label}>Starting password</label>
              <div className="flex gap-2">
                <input
                  className={input}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 10 characters"
                  required
                />
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => setForm({ ...form, password: suggestPassword() })}
                  title="Suggest one"
                >
                  <KeyRound className="h-4 w-4" /> Suggest
                </button>
              </div>
              <p className="mt-1 text-[11px] text-[var(--ad-text-quaternary)]">
                Give it to them directly and ask them to change it. Suggested passwords avoid
                characters that are easy to misread, like l and 1.
              </p>
            </div>
          )}

          <div>
            <label className={label}>Access level</label>
            <select
              className={input}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "staff" })}
            >
              <option value="staff">Staff — clients, bookings, no finance</option>
              <option value="admin">Admin — everything, including finance</option>
            </select>
          </div>

          <label className="flex items-center gap-2.5 text-[13px] text-[var(--ad-text-secondary)]">
            <input
              type="checkbox"
              checked={form.is_mentor}
              onChange={(e) => setForm({ ...form, is_mentor: e.target.checked })}
            />
            Students can book consultations with them
          </label>

          <div>
            <label className={label}>Status</label>
            <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StaffStatus })}>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </form>
      </AdminModal>

      {/* Delete confirm */}
      <AdminModal
        open={!!confirmDelete}
        title="Delete staff member?"
        subtitle={confirmDelete ? `${confirmDelete.full_name} and their attendance history will be removed.` : ""}
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <button className={btnGhost} onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className={btnDanger} onClick={doDelete} disabled={!!busyId}>
              {busyId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-300">This cannot be undone.</p>
      </AdminModal>

      <AvailabilityModal staff={availabilityStaff} onClose={() => setAvailabilityStaff(null)} />
    </div>
  );
}
