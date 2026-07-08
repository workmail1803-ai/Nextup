"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ClientService } from "@/lib/services/client.service";
import { StaffService } from "@/lib/services/staff.service";
import type { Staff } from "@/lib/types/staff";
import type {
  ClientStage, ClientWithRelations, DegreeLevel,
} from "@/lib/types/client";
import { AdminModal, Badge, btnDanger, btnGhost, btnPrimary, input, label } from "./AdminUI";
import { COUNTRIES, DEGREE, STAGE, STAGE_KEYS, fmtDate } from "./clientMeta";
import { ClientDetail } from "./ClientDetail";

interface ClientForm {
  id?: string;
  full_name: string;
  country_interest: string[];
  degree: DegreeLevel | "";
  email: string;
  facebook_id: string;
  whatsapp: string;
  stage: ClientStage;
  primary_consultant_id: string;
  notes: string;
  ssc_result: string;
  ssc_year: string;
  hsc_result: string;
  hsc_year: string;
  ielts_score: string;
}
const EMPTY: ClientForm = {
  full_name: "", country_interest: [], degree: "", email: "", facebook_id: "",
  whatsapp: "", stage: "lead", primary_consultant_id: "", notes: "",
  ssc_result: "", ssc_year: "", hsc_result: "", hsc_year: "", ielts_score: "",
};

function latestMeeting(c: ClientWithRelations): string | null {
  const dates = (c.client_meetings ?? []).map((m) => m.scheduled_at).filter(Boolean) as string[];
  if (dates.length === 0) return null;
  return dates.sort().at(-1) ?? null;
}

export function ClientsSection() {
  const [clients, setClients] = useState<ClientWithRelations[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | ClientStage>("all");
  const [consultantFilter, setConsultantFilter] = useState<"all" | string>("all");
  const [page, setPage] = useState(0);
  const PAGE = 12;

  const [detail, setDetail] = useState<ClientWithRelations | null>(null);
  const [form, setForm] = useState<ClientForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ClientWithRelations | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([ClientService.listWithRelations(), StaffService.list()]);
      setClients(c);
      setStaff(s);
      setErr(null);
    } catch {
      setErr("Could not load clients. Ensure migration 0003 has been applied.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const unsub = ClientService.subscribe(fetchAll);
    return unsub;
  }, [fetchAll]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (stageFilter !== "all" && c.stage !== stageFilter) return false;
      if (consultantFilter !== "all" && c.primary_consultant_id !== consultantFilter) return false;
      if (!q) return true;
      return (c.full_name + " " + (c.email ?? "") + " " + (c.whatsapp ?? "") + " " + c.country_interest.join(" "))
        .toLowerCase().includes(q);
    });
  }, [clients, query, stageFilter, consultantFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * PAGE, safePage * PAGE + PAGE);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !form.full_name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        country_interest: form.country_interest,
        degree: form.degree || null,
        email: form.email.trim() || null,
        facebook_id: form.facebook_id.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        stage: form.stage,
        primary_consultant_id: form.primary_consultant_id || null,
        notes: form.notes.trim() || null,
        ssc_result: form.ssc_result.trim() || null,
        ssc_year: form.ssc_year ? Number(form.ssc_year) : null,
        hsc_result: form.hsc_result.trim() || null,
        hsc_year: form.hsc_year ? Number(form.hsc_year) : null,
        ielts_score: form.ielts_score ? Number(form.ielts_score) : null,
      };
      if (form.id) await ClientService.update(form.id, payload);
      else await ClientService.create(payload);
      setForm(null);
      await fetchAll();
    } catch {
      setErr("Could not save the client.");
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await ClientService.remove(confirmDelete.id);
      setConfirmDelete(null);
      setDetail(null);
      await fetchAll();
    } finally {
      setBusy(false);
    }
  }

  function openCreate() {
    setForm({ ...EMPTY });
  }
  function openEdit(c: ClientWithRelations) {
    setForm({
      id: c.id, full_name: c.full_name, country_interest: c.country_interest,
      degree: c.degree ?? "", email: c.email ?? "", facebook_id: c.facebook_id ?? "",
      whatsapp: c.whatsapp ?? "", stage: c.stage, primary_consultant_id: c.primary_consultant_id ?? "",
      notes: c.notes ?? "",
      ssc_result: c.ssc_result ?? "", ssc_year: c.ssc_year?.toString() ?? "",
      hsc_result: c.hsc_result ?? "", hsc_year: c.hsc_year?.toString() ?? "",
      ielts_score: c.ielts_score?.toString() ?? "",
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Clients</h2>
          <p className="text-sm text-slate-400">{clients.length} records · meetings &amp; visa checklists, replacing the Google Sheets.</p>
        </div>
        <button className={btnPrimary} onClick={openCreate}><Plus className="h-4 w-4" /> Add Client</button>
      </div>

      {err && <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</div>}

      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className={`${input} pl-9`} placeholder="Search name, email, phone…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} />
        </div>
        <div className="flex flex-wrap gap-2">
          <select className={`${input} w-auto`} value={stageFilter} onChange={(e) => { setStageFilter(e.target.value as typeof stageFilter); setPage(0); }}>
            <option value="all">All stages</option>
            {STAGE_KEYS.map((k) => (<option key={k} value={k}>{STAGE[k].label}</option>))}
          </select>
          <select className={`${input} w-auto`} value={consultantFilter} onChange={(e) => { setConsultantFilter(e.target.value); setPage(0); }}>
            <option value="all">All consultants</option>
            {staff.map((s) => (<option key={s.id} value={s.id}>{s.full_name}</option>))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-800/50 text-left text-xs font-semibold text-slate-400">
              <tr>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Country</th>
                <th className="px-5 py-3">Degree</th>
                <th className="px-5 py-3">Stage</th>
                <th className="px-5 py-3">Consultant</th>
                <th className="px-5 py-3">Latest meeting</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-700/40"><td colSpan={7} className="px-5 py-4"><div className="h-5 w-full animate-pulse rounded bg-slate-700/40" /></td></tr>
                ))
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-14 text-center text-slate-500">No clients match your filters.</td></tr>
              ) : (
                paged.map((c) => (
                  <tr key={c.id} className="cursor-pointer border-t border-slate-700/40 hover:bg-slate-800/30" onClick={() => setDetail(c)}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{c.full_name}</p>
                      <p className="text-xs text-slate-500">{c.email || c.whatsapp || "—"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.country_interest.length ? c.country_interest.map((co) => (
                          <span key={co} className="rounded-md bg-slate-700/40 px-1.5 py-0.5 text-xs text-slate-300">{co}</span>
                        )) : <span className="text-slate-600">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{c.degree ? DEGREE[c.degree] : "—"}</td>
                    <td className="px-5 py-3"><Badge label={STAGE[c.stage].label} tone={STAGE[c.stage].tone} /></td>
                    <td className="px-5 py-3 text-slate-300">{c.consultant?.full_name ?? <span className="text-slate-600">Unassigned</span>}</td>
                    <td className="px-5 py-3 text-slate-400">{fmtDate(latestMeeting(c))}</td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <button className="rounded-lg bg-slate-700/40 p-2 text-slate-300 hover:bg-slate-700/70 hover:text-white" title="Edit" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></button>
                        <button className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/25" title="Delete" onClick={() => setConfirmDelete(c)}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-700/40 px-5 py-3 text-xs text-slate-400">
            <span>{safePage * PAGE + 1}–{Math.min((safePage + 1) * PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-2">
              <button className="rounded-lg bg-slate-700/40 px-3 py-1.5 disabled:opacity-40" disabled={safePage === 0} onClick={() => setPage((p) => p - 1)}>Prev</button>
              <span>{safePage + 1} / {pageCount}</span>
              <button className="rounded-lg bg-slate-700/40 px-3 py-1.5 disabled:opacity-40" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {detail && (
        <ClientDetail
          client={detail}
          staff={staff}
          onClose={() => setDetail(null)}
          onEdit={() => { openEdit(detail); }}
          onChanged={fetchAll}
        />
      )}

      {/* Create / edit client */}
      <AdminModal
        open={!!form}
        wide
        title={form?.id ? "Edit client" : "Add client"}
        onClose={() => setForm(null)}
        footer={
          <>
            <button className={btnGhost} onClick={() => setForm(null)}>Cancel</button>
            <button className={btnPrimary} onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save</button>
          </>
        }
      >
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Full name</label>
                <input className={input} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} autoFocus required />
              </div>
              <div>
                <label className={label}>Degree</label>
                <select className={input} value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value as DegreeLevel | "" })}>
                  <option value="">—</option>
                  <option value="bachelors">Bachelor&apos;s</option>
                  <option value="masters">Master&apos;s</option>
                </select>
              </div>
            </div>
            <div>
              <label className={label}>Countries of interest</label>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((co) => {
                  const on = form.country_interest.includes(co);
                  return (
                    <button key={co} type="button"
                      onClick={() => setForm({ ...form, country_interest: on ? form.country_interest.filter((x) => x !== co) : [...form.country_interest, co] })}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${on ? "bg-amber-500/20 text-amber-400" : "bg-slate-800/60 text-slate-400 hover:text-white"}`}>
                      {co}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className={label}>Email</label><input className={input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className={label}>WhatsApp</label><input className={input} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Stage</label>
                <select className={input} value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as ClientStage })}>
                  {STAGE_KEYS.map((k) => (<option key={k} value={k}>{STAGE[k].label}</option>))}
                </select>
              </div>
              <div>
                <label className={label}>Consultant</label>
                <select className={input} value={form.primary_consultant_id} onChange={(e) => setForm({ ...form, primary_consultant_id: e.target.value })}>
                  <option value="">Unassigned</option>
                  {staff.map((s) => (<option key={s.id} value={s.id}>{s.full_name}</option>))}
                </select>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Academic results</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className={label}>SSC Result</label><input className={input} placeholder="e.g. 5.00 or A+" value={form.ssc_result} onChange={(e) => setForm({ ...form, ssc_result: e.target.value })} /></div>
                <div><label className={label}>SSC Year</label><input className={input} type="number" placeholder="e.g. 2018" min={2000} max={2099} value={form.ssc_year} onChange={(e) => setForm({ ...form, ssc_year: e.target.value })} /></div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div><label className={label}>HSC Result</label><input className={input} placeholder="e.g. 5.00 or A+" value={form.hsc_result} onChange={(e) => setForm({ ...form, hsc_result: e.target.value })} /></div>
                <div><label className={label}>HSC Year</label><input className={input} type="number" placeholder="e.g. 2020" min={2000} max={2099} value={form.hsc_year} onChange={(e) => setForm({ ...form, hsc_year: e.target.value })} /></div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className={label}>IELTS Score</label><input className={input} type="number" step="0.5" min={0} max={9} placeholder="e.g. 6.5" value={form.ielts_score} onChange={(e) => setForm({ ...form, ielts_score: e.target.value })} /></div>
            </div>
            <div><label className={label}>Notes</label><textarea className={input} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </form>
        )}
      </AdminModal>

      {/* Delete confirm */}
      <AdminModal
        open={!!confirmDelete}
        title="Delete client?"
        subtitle={confirmDelete ? `${confirmDelete.full_name}, their meetings and visa records will be removed.` : ""}
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <button className={btnGhost} onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className={btnDanger} onClick={doDelete} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete</button>
          </>
        }
      >
        <p className="text-sm text-slate-300">This cannot be undone.</p>
      </AdminModal>
    </div>
  );
}
