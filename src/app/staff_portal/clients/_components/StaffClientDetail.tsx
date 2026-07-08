"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarPlus, FileCheck2, Loader2, Mail, MessageCircle, Plus, Save, ShieldCheck,
} from "lucide-react";
import { Modal, StatusBadge, useToast } from "@/components/internal";
import { MeetingService, type MeetingWithNames } from "@/lib/services/meeting.service";
import { VisaService, type VisaWithDocs } from "@/lib/services/visa.service";
import { ClientService } from "@/lib/services/client.service";
import type {
  ClientStage, ClientWithRelations, MeetingStatus, VisaDocStatus, VisaStatus,
} from "@/lib/types/client";
import {
  STAGE_META, MEETING_STATUS_META, VISA_STATUS_META, VISA_DOC_STATUS_META,
} from "@/lib/types/client";

const STAGES = Object.keys(STAGE_META) as ClientStage[];
const DOC_CYCLE: VisaDocStatus[] = ["pending", "received", "verified", "na"];

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function fmtDateTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "No date set";
}

interface MeetingForm {
  id?: string; scheduled_at: string; status: MeetingStatus; comments: string; follow_up_note: string;
}

export function StaffClientDetail({
  client, currentStaffId, onClose, onChanged,
}: {
  client: ClientWithRelations;
  currentStaffId?: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [meetings, setMeetings] = useState<MeetingWithNames[]>([]);
  const [visa, setVisa] = useState<VisaWithDocs | null>(null);
  const [loading, setLoading] = useState(true);

  const [stage, setStage] = useState<ClientStage>(client.stage);
  const [notes, setNotes] = useState(client.notes ?? "");
  const [savingClient, setSavingClient] = useState(false);

  const [mForm, setMForm] = useState<MeetingForm | null>(null);
  const [savingM, setSavingM] = useState(false);

  const load = useCallback(async () => {
    const [m, v] = await Promise.all([
      MeetingService.listForClient(client.id),
      VisaService.getForClient(client.id),
    ]);
    setMeetings(m);
    setVisa(v);
    setLoading(false);
  }, [client.id]);

  useEffect(() => { load(); }, [load]);

  async function saveClient() {
    setSavingClient(true);
    try {
      await ClientService.update(client.id, { stage, notes: notes.trim() || null });
      toast({ title: "Client updated", tone: "success" });
      onChanged();
    } catch {
      toast({ title: "Couldn't save changes", tone: "error" });
    } finally {
      setSavingClient(false);
    }
  }

  async function saveMeeting() {
    if (!mForm) return;
    setSavingM(true);
    try {
      const payload = {
        scheduled_at: mForm.scheduled_at ? new Date(mForm.scheduled_at).toISOString() : null,
        status: mForm.status,
        comments: mForm.comments || null,
        follow_up_note: mForm.follow_up_note || null,
      };
      if (mForm.id) await MeetingService.update(mForm.id, payload);
      else await MeetingService.create({ client_id: client.id, consultant_id: client.primary_consultant_id, forwarded_by_staff_id: currentStaffId ?? null, ...payload });
      setMForm(null);
      await load();
      onChanged();
      toast({ title: "Meeting saved", tone: "success" });
    } finally {
      setSavingM(false);
    }
  }

  async function cycleDoc(docId: string, cur: VisaDocStatus) {
    if (!visa) return;
    const next = DOC_CYCLE[(DOC_CYCLE.indexOf(cur) + 1) % DOC_CYCLE.length];
    setVisa({ ...visa, documents: visa.documents.map((d) => (d.id === docId ? { ...d, status: next } : d)) });
    await VisaService.updateDocument(docId, { status: next });
  }
  async function setVisaStatus(s: VisaStatus) {
    if (!visa) return;
    setVisa({ ...visa, status: s });
    await VisaService.updateVisa(visa.id, { status: s });
  }
  async function startVisa() {
    setVisa(await VisaService.ensureForClient(client.id));
    onChanged();
  }

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={
        <span className="flex items-center gap-2.5">
          {client.full_name}
          <StatusBadge label={STAGE_META[client.stage].label} tone={STAGE_META[client.stage].tone} />
        </span>
      }
      description={client.country_interest.join(" · ") || "No country set"}
    >
      {/* contact */}
      <div className="mb-5 flex flex-wrap gap-2">
        {client.email && (
          <a href={`mailto:${client.email}`} className="nx-chip"><Mail className="h-3.5 w-3.5" /> {client.email}</a>
        )}
        {client.whatsapp && (
          <a href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="nx-chip" style={{ color: "var(--nx-positive)" }}>
            <MessageCircle className="h-3.5 w-3.5" /> {client.whatsapp}
          </a>
        )}
      </div>

      {/* academic info */}
      {(client.ssc_result || client.hsc_result || client.ielts_score != null) && (
        <div className="mb-5 rounded-xl p-4" style={{ background: "var(--nx-panel-2)", border: "1px solid var(--nx-edge)" }}>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--nx-faint)" }}>
            Academic &amp; IELTS
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            {client.ssc_result && (
              <div>
                <p className="nx-label mb-0.5">SSC</p>
                <p style={{ color: "var(--nx-text)" }}>
                  {client.ssc_result}{client.ssc_year ? ` (${client.ssc_year})` : ""}
                </p>
              </div>
            )}
            {client.hsc_result && (
              <div>
                <p className="nx-label mb-0.5">HSC</p>
                <p style={{ color: "var(--nx-text)" }}>
                  {client.hsc_result}{client.hsc_year ? ` (${client.hsc_year})` : ""}
                </p>
              </div>
            )}
            {client.ielts_score != null && (
              <div>
                <p className="nx-label mb-0.5">IELTS</p>
                <p className="font-semibold" style={{ color: "var(--nx-accent-2)" }}>
                  {client.ielts_score}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* editable client fields */}
      <div className="mb-6 rounded-xl p-4" style={{ background: "var(--nx-panel-2)", border: "1px solid var(--nx-edge)" }}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="nx-label">Stage</label>
            <select className="nx-input" value={stage} onChange={(e) => setStage(e.target.value as ClientStage)}>
              {STAGES.map((s) => (<option key={s} value={s}>{STAGE_META[s].label}</option>))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="nx-btn nx-btn-primary" onClick={saveClient} disabled={savingClient}>
              {savingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
            </button>
          </div>
        </div>
        <div className="mt-3">
          <label className="nx-label">Notes</label>
          <textarea className="nx-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add a note about this client…" />
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" style={{ color: "var(--nx-faint)" }} /></div>
      ) : (
        <div className="space-y-6">
          {/* meetings */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--nx-text)" }}>
                <CalendarPlus className="h-4 w-4" style={{ color: "var(--nx-accent-2)" }} /> Meetings ({meetings.length})
              </h4>
              <button className="text-xs font-semibold" style={{ color: "var(--nx-accent-2)" }}
                onClick={() => setMForm({ scheduled_at: "", status: "scheduled", comments: "", follow_up_note: "" })}>
                + Add meeting
              </button>
            </div>
            {meetings.length === 0 ? (
              <p className="rounded-xl px-4 py-6 text-center text-sm" style={{ background: "var(--nx-panel-2)", color: "var(--nx-faint)" }}>No meetings yet.</p>
            ) : (
              <div className="space-y-2">
                {meetings.map((m) => (
                  <div key={m.id} className="rounded-xl p-3.5" style={{ background: "var(--nx-panel-2)", border: "1px solid var(--nx-edge)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: "var(--nx-text)" }}>{fmtDateTime(m.scheduled_at)}</span>
                          <StatusBadge label={MEETING_STATUS_META[m.status].label} tone={MEETING_STATUS_META[m.status].tone} />
                        </div>
                        {m.comments && <p className="mt-1 text-xs" style={{ color: "var(--nx-muted)" }}>{m.comments}</p>}
                      </div>
                      <button className="shrink-0 rounded-md p-1.5" style={{ color: "var(--nx-faint)" }} title="Edit"
                        onClick={() => setMForm({ id: m.id, scheduled_at: toLocalInput(m.scheduled_at), status: m.status, comments: m.comments ?? "", follow_up_note: m.follow_up_note ?? "" })}>
                        <Save className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* visa */}
          <section>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--nx-text)" }}>
              <ShieldCheck className="h-4 w-4" style={{ color: "var(--nx-accent-2)" }} /> Visa &amp; documents
            </h4>
            {!visa ? (
              <div className="rounded-xl px-4 py-6 text-center" style={{ background: "var(--nx-panel-2)" }}>
                <p className="mb-3 text-sm" style={{ color: "var(--nx-faint)" }}>No visa process started.</p>
                <button className="nx-btn nx-btn-primary" onClick={startVisa}><FileCheck2 className="h-4 w-4" /> Start visa process</button>
              </div>
            ) : (
              <div className="rounded-xl p-4" style={{ background: "var(--nx-panel-2)", border: "1px solid var(--nx-edge)" }}>
                <div className="mb-4">
                  <label className="nx-label">Status</label>
                  <select className="nx-input" value={visa.status} onChange={(e) => setVisaStatus(e.target.value as VisaStatus)}>
                    {Object.entries(VISA_STATUS_META).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  {visa.documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: "var(--nx-bg-2)" }}>
                      <span className="text-sm" style={{ color: "var(--nx-muted)" }}>{d.document_name}</span>
                      <button onClick={() => cycleDoc(d.id, d.status)} title="Click to change">
                        <StatusBadge label={VISA_DOC_STATUS_META[d.status].label} tone={VISA_DOC_STATUS_META[d.status].tone} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* meeting form (nested) */}
      <Modal open={!!mForm} title={mForm?.id ? "Edit meeting" : "Add meeting"} onClose={() => setMForm(null)}
        footer={<><button className="nx-btn nx-btn-ghost" onClick={() => setMForm(null)}>Cancel</button><button className="nx-btn nx-btn-primary" onClick={saveMeeting} disabled={savingM}>{savingM ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save</button></>}>
        {mForm && (
          <div className="space-y-4">
            <div>
              <label className="nx-label">Date &amp; time</label>
              <input type="datetime-local" className="nx-input" value={mForm.scheduled_at} onChange={(e) => setMForm({ ...mForm, scheduled_at: e.target.value })} />
            </div>
            <div>
              <label className="nx-label">Status</label>
              <select className="nx-input" value={mForm.status} onChange={(e) => setMForm({ ...mForm, status: e.target.value as MeetingStatus })}>
                {Object.entries(MEETING_STATUS_META).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
              </select>
            </div>
            <div>
              <label className="nx-label">Comments</label>
              <textarea className="nx-input" rows={2} value={mForm.comments} onChange={(e) => setMForm({ ...mForm, comments: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </Modal>
  );
}
