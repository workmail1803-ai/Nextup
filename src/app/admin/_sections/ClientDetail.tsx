"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarPlus, ExternalLink, FileCheck2, Loader2, Mail, MessageCircle, Pencil, Plus,
  ShieldCheck, Trash2,
} from "lucide-react";
import { MeetingService, type MeetingWithNames } from "@/lib/services/meeting.service";
import { VisaService, type VisaWithDocs } from "@/lib/services/visa.service";
// Signing a client-document URL needs the staff JWT. The anon client lost
// access to that bucket in migration 0012 and returns 400.
import { staffSupabase } from "@/lib/auth/supabase-staff";
import type { Staff } from "@/lib/types/staff";
import type {
  ClientWithRelations, MeetingStatus, VisaDocStatus, VisaStatus,
} from "@/lib/types/client";
import { AdminModal, Badge, btnGhost, btnPrimary, input, label } from "./AdminUI";
import { DOC, MEETING, STAGE, VISA, fmtDateTime } from "./clientMeta";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
function fromLocalInput(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

const DOC_CYCLE: VisaDocStatus[] = ["pending", "received", "verified", "na"];

interface MeetingForm {
  id?: string;
  scheduled_at: string;
  consultant_id: string;
  status: MeetingStatus;
  comments: string;
  reminder: string;
  follow_up_comments: string;
  follow_up_note: string;
}
const EMPTY_MEETING: MeetingForm = {
  scheduled_at: "", consultant_id: "", status: "scheduled",
  comments: "", reminder: "", follow_up_comments: "", follow_up_note: "",
};

export function ClientDetail({
  client, staff, onClose, onEdit, onChanged,
}: {
  client: ClientWithRelations;
  staff: Staff[];
  onClose: () => void;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [meetings, setMeetings] = useState<MeetingWithNames[]>([]);
  const [visa, setVisa] = useState<VisaWithDocs | null>(null);
  const [loading, setLoading] = useState(true);

  const [meetingForm, setMeetingForm] = useState<MeetingForm | null>(null);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [visaBusy, setVisaBusy] = useState(false);

  const load = useCallback(async () => {
    const [m, v] = await Promise.all([
      MeetingService.listForClient(client.id),
      VisaService.getForClient(client.id),
    ]);
    setMeetings(m);
    setVisa(v);
    setLoading(false);
  }, [client.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingForm) return;
    setSavingMeeting(true);
    try {
      const payload = {
        scheduled_at: fromLocalInput(meetingForm.scheduled_at),
        consultant_id: meetingForm.consultant_id || null,
        status: meetingForm.status,
        comments: meetingForm.comments || null,
        reminder: meetingForm.reminder || null,
        follow_up_comments: meetingForm.follow_up_comments || null,
        follow_up_note: meetingForm.follow_up_note || null,
      };
      if (meetingForm.id) await MeetingService.update(meetingForm.id, payload);
      else await MeetingService.create({ client_id: client.id, ...payload });
      setMeetingForm(null);
      await load();
      onChanged();
    } finally {
      setSavingMeeting(false);
    }
  }

  async function deleteMeeting(id: string) {
    await MeetingService.remove(id);
    await load();
    onChanged();
  }

  async function startVisa() {
    setVisaBusy(true);
    try {
      setVisa(await VisaService.ensureForClient(client.id));
      onChanged();
    } finally {
      setVisaBusy(false);
    }
  }

  async function setVisaStatus(status: VisaStatus) {
    if (!visa) return;
    setVisa({ ...visa, status });
    await VisaService.updateVisa(visa.id, { status });
  }
  async function setVfsDate(date: string) {
    if (!visa) return;
    setVisa({ ...visa, vfs_appointment_date: date || null });
    await VisaService.updateVisa(visa.id, { vfs_appointment_date: date || null });
  }
  async function cycleDoc(docId: string, cur: VisaDocStatus) {
    if (!visa) return;
    const next = DOC_CYCLE[(DOC_CYCLE.indexOf(cur) + 1) % DOC_CYCLE.length];
    setVisa({ ...visa, documents: visa.documents.map((d) => (d.id === docId ? { ...d, status: next } : d)) });
    await VisaService.updateDocument(docId, { status: next });
  }

  const consultantName = (id: string | null) => staff.find((s) => s.id === id)?.full_name ?? "Unassigned";

  return (
    <AdminModal
      open
      wide
      onClose={onClose}
      title={
        <span className="flex items-center gap-2.5">
          {client.full_name}
          <Badge label={STAGE[client.stage].label} tone={STAGE[client.stage].tone} />
        </span>
      }
      subtitle={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {client.country_interest.map((c) => (
            <span key={c} className="text-slate-400">{c}</span>
          ))}
          {client.consultant && <span className="text-amber-400">· {client.consultant.full_name}</span>}
        </span>
      }
      footer={<button className={btnGhost} onClick={onEdit}><Pencil className="h-4 w-4" /> Edit client</button>}
    >
      {/* Contact row */}
      <div className="mb-5 flex flex-wrap gap-2">
        {client.email && (
          <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 hover:text-white">
            <Mail className="h-3.5 w-3.5" /> {client.email}
          </a>
        )}
        {client.whatsapp && (
          <a href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/20">
            <MessageCircle className="h-3.5 w-3.5" /> {client.whatsapp}
          </a>
        )}
      </div>

      {loading ? (
        <div className="py-10 text-center text-slate-500"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {/* Meetings */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                <CalendarPlus className="h-4 w-4 text-amber-400" /> Meetings ({meetings.length})
              </h4>
              <button className="text-xs font-semibold text-amber-400 hover:text-amber-300" onClick={() => setMeetingForm({ ...EMPTY_MEETING, consultant_id: client.primary_consultant_id ?? "" })}>
                + Add meeting
              </button>
            </div>

            {meetings.length === 0 ? (
              <p className="rounded-xl bg-slate-800/40 px-4 py-6 text-center text-sm text-slate-500">No meetings yet.</p>
            ) : (
              <div className="space-y-2">
                {meetings.map((m) => (
                  <div key={m.id} className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-white">{fmtDateTime(m.scheduled_at)}</span>
                          <Badge label={MEETING[m.status].label} tone={MEETING[m.status].tone} />
                          <span className="text-xs text-slate-500">{m.consultant?.full_name ?? m.consultant_raw ?? consultantName(m.consultant_id)}</span>
                        </div>
                        {m.comments && <p className="mt-1.5 text-xs text-slate-300">{m.comments}</p>}
                        {m.follow_up_comments && <p className="mt-1 text-xs text-slate-400">↳ {m.follow_up_comments}</p>}
                        {m.follow_up_note && <p className="mt-1 text-xs text-amber-400/80">Reminder: {m.follow_up_note}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700/60 hover:text-white" title="Edit" onClick={() => setMeetingForm({
                          id: m.id, scheduled_at: toLocalInput(m.scheduled_at), consultant_id: m.consultant_id ?? "",
                          status: m.status, comments: m.comments ?? "", reminder: m.reminder ?? "",
                          follow_up_comments: m.follow_up_comments ?? "", follow_up_note: m.follow_up_note ?? "",
                        })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded-md p-1.5 text-red-400 hover:bg-red-500/15" title="Delete" onClick={() => deleteMeeting(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Visa */}
          <section>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-amber-400" /> Visa &amp; documents
            </h4>
            {!visa ? (
              <div className="rounded-xl bg-slate-800/40 px-4 py-6 text-center">
                <p className="mb-3 text-sm text-slate-500">No visa process started for this client.</p>
                <button className={btnPrimary} onClick={startVisa} disabled={visaBusy}>
                  {visaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />} Start visa process
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-4">
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={label}>Status</label>
                    <select className={input} value={visa.status} onChange={(e) => setVisaStatus(e.target.value as VisaStatus)}>
                      {Object.entries(VISA).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className={label}>VFS appointment</label>
                    <input type="date" className={input} value={visa.vfs_appointment_date ?? ""} onChange={(e) => setVfsDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  {visa.documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/40 px-3 py-2">
                      <span className="text-sm text-slate-200">{d.document_name}</span>
                      <div className="flex items-center gap-2">
                        {d.file_url && (
                          <button
                            className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-400 hover:bg-amber-500/20"
                            onClick={async () => {
                              try {
                                const url = await VisaService.getSignedUrl(staffSupabase, d.file_url!, 3600);
                                window.open(url, "_blank");
                              } catch { /* silent */ }
                            }}
                            title="View uploaded file"
                          >
                            <ExternalLink className="h-3 w-3" /> View
                          </button>
                        )}
                        <button onClick={() => cycleDoc(d.id, d.status)} title="Click to change status">
                          <Badge label={DOC[d.status].label} tone={DOC[d.status].tone} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Meeting add/edit modal (nested) */}
      <AdminModal
        open={!!meetingForm}
        title={meetingForm?.id ? "Edit meeting" : "Add meeting"}
        onClose={() => setMeetingForm(null)}
        footer={
          <>
            <button className={btnGhost} onClick={() => setMeetingForm(null)}>Cancel</button>
            <button className={btnPrimary} onClick={saveMeeting} disabled={savingMeeting}>
              {savingMeeting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save meeting
            </button>
          </>
        }
      >
        {meetingForm && (
          <form onSubmit={saveMeeting} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Date &amp; time</label>
                <input type="datetime-local" className={input} value={meetingForm.scheduled_at} onChange={(e) => setMeetingForm({ ...meetingForm, scheduled_at: e.target.value })} />
              </div>
              <div>
                <label className={label}>Consultant</label>
                <select className={input} value={meetingForm.consultant_id} onChange={(e) => setMeetingForm({ ...meetingForm, consultant_id: e.target.value })}>
                  <option value="">Unassigned</option>
                  {staff.map((s) => (<option key={s.id} value={s.id}>{s.full_name}</option>))}
                </select>
              </div>
            </div>
            <div>
              <label className={label}>Status</label>
              <select className={input} value={meetingForm.status} onChange={(e) => setMeetingForm({ ...meetingForm, status: e.target.value as MeetingStatus })}>
                {Object.entries(MEETING).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
              </select>
            </div>
            <div>
              <label className={label}>Comments</label>
              <textarea className={input} rows={2} value={meetingForm.comments} onChange={(e) => setMeetingForm({ ...meetingForm, comments: e.target.value })} />
            </div>
            <div>
              <label className={label}>Follow-up note</label>
              <input className={input} value={meetingForm.follow_up_note} onChange={(e) => setMeetingForm({ ...meetingForm, follow_up_note: e.target.value })} placeholder="e.g. call Thursday 3pm" />
            </div>
          </form>
        )}
      </AdminModal>
    </AdminModal>
  );
}
