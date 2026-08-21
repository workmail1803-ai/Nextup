"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, ExternalLink, GraduationCap, Mail, MessageSquare, Phone, Plane, Plus, Trash2 } from "lucide-react";
import { Avatar, StatusBadge, useToast } from "@/components/internal";
import { ClientService } from "@/lib/services/client.service";
import { MeetingService, type MeetingWithNames } from "@/lib/services/meeting.service";
import { BookForClient } from "./BookForClient";
import { VisaService, type VisaWithDocs } from "@/lib/services/visa.service";
import { supabase } from "@/lib/supabase";
import {
  DEGREE_META, MEETING_STATUS_META, STAGE_META, VISA_DOC_STATUS_META, VISA_STATUS_META,
  type ClientStage, type ClientWithRelations, type MeetingStatus, type VisaDocStatus, type VisaStatus,
} from "@/lib/types/client";
import type { Staff } from "@/lib/types/staff";
import { Sheet } from "./Sheet";
import { JourneyStrip } from "./JourneyStrip";

const ALL_STAGES = Object.keys(STAGE_META) as ClientStage[];
const MEETING_STATUSES = Object.keys(MEETING_STATUS_META) as MeetingStatus[];
const VISA_STATUSES = Object.keys(VISA_STATUS_META) as VisaStatus[];
const DOC_STATUSES = Object.keys(VISA_DOC_STATUS_META) as VisaDocStatus[];

const miniInput = "nx-input px-2.5 py-1.5 text-xs";

interface ClientSheetProps {
  client: ClientWithRelations | null;
  staff: Staff[];
  onClose: () => void;
  /** Called after any successful mutation so the parent can refresh its lists. */
  onChanged: () => void;
}

/**
 * One sheet, the whole student: journey + stage mover, contact actions,
 * meetings, and the visa checklist. Every workflow the counsellor repeats
 * fifty times a day fits in a thumb's reach.
 */
export function ClientSheet({ client, staff, onClose, onChanged }: ClientSheetProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [docBusy, setDocBusy] = useState(false);
  const toast = useToast();
  const [stage, setStage] = useState<ClientStage>("lead");
  const [meetings, setMeetings] = useState<MeetingWithNames[]>([]);
  const [visa, setVisa] = useState<VisaWithDocs | null>(null);
  const [busy, setBusy] = useState(false);

  const clientId = client?.id ?? null;

  const loadDetail = useCallback(() => {
    if (!clientId) return;
    MeetingService.listForClient(clientId).then(setMeetings).catch(() => setMeetings([]));
    VisaService.getForClient(clientId).then(setVisa).catch(() => setVisa(null));
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    const t = setTimeout(() => {
      if (client) setStage(client.stage);
      loadDetail();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function moveStage(next: ClientStage) {
    if (!client || next === stage) return;
    const prev = stage;
    setStage(next);
    try {
      await ClientService.update(client.id, { stage: next });
      toast({ title: `Moved to ${STAGE_META[next].label}`, tone: "success" });
      onChanged();
    } catch (err) {
      setStage(prev);
      toast({ title: "Couldn't move stage", description: err instanceof Error ? err.message : String(err), tone: "error" });
    }
  }

  // --- Meetings ---
  const [mDate, setMDate] = useState("");
  const [mConsultant, setMConsultant] = useState("");

  async function addMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!client) return;
    setBusy(true);
    try {
      await MeetingService.create({
        client_id: client.id,
        scheduled_at: mDate ? new Date(mDate).toISOString() : null,
        consultant_id: mConsultant || client.primary_consultant_id || null,
        status: "scheduled",
      });
      setMDate("");
      toast({ title: "Meeting added", tone: "success" });
      loadDetail();
      onChanged();
    } catch (err) {
      toast({ title: "Couldn't add meeting", description: err instanceof Error ? err.message : String(err), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function setMeetingStatus(id: string, status: MeetingStatus) {
    try {
      await MeetingService.update(id, { status });
      loadDetail();
    } catch (err) {
      toast({ title: "Couldn't update meeting", description: err instanceof Error ? err.message : String(err), tone: "error" });
    }
  }

  async function removeMeeting(id: string) {
    try {
      await MeetingService.remove(id);
      toast({ title: "Meeting removed", tone: "success" });
      loadDetail();
    } catch (err) {
      toast({ title: "Couldn't remove meeting", description: err instanceof Error ? err.message : String(err), tone: "error" });
    }
  }

  // --- Visa ---
  async function openVisaFile() {
    if (!client) return;
    setBusy(true);
    try {
      setVisa(await VisaService.ensureForClient(client.id));
      toast({ title: "Visa file opened", tone: "success" });
    } catch (err) {
      toast({ title: "Couldn't open visa file", description: err instanceof Error ? err.message : String(err), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function setVisaStatus(status: VisaStatus) {
    if (!visa) return;
    try {
      await VisaService.updateVisa(visa.id, { status });
      loadDetail();
    } catch (err) {
      toast({ title: "Couldn't update visa", description: err instanceof Error ? err.message : String(err), tone: "error" });
    }
  }

  async function setDocStatus(id: string, status: VisaDocStatus) {
    try {
      await VisaService.updateDocument(id, { status });
      loadDetail();
    } catch (err) {
      toast({ title: "Couldn't update document", description: err instanceof Error ? err.message : String(err), tone: "error" });
    }
  }

  /** Add a requirement beyond the standard checklist. Marked as staff-added, so
   *  the student's portal can say who asked for it rather than leaving them to
   *  wonder why the list grew. */
  async function addDoc() {
    if (!visa || newDocName.trim().length < 2) return;
    setDocBusy(true);
    try {
      await VisaService.addDocument(visa.id, newDocName.trim());
      setVisa(await VisaService.getForClient(client!.id));
      setNewDocName("");
      toast({ title: "Requirement added", description: "The student can see it now.", tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't add that",
        description: err instanceof Error ? err.message : String(err),
        tone: "error",
      });
    } finally {
      setDocBusy(false);
    }
  }

  async function removeDoc(id: string, name: string, fileUrl: string | null) {
    const warn = fileUrl
      ? `Remove "${name}"? The student's uploaded file will be deleted too.`
      : `Remove "${name}" from this checklist?`;
    if (!confirm(warn)) return;
    setDocBusy(true);
    try {
      await VisaService.removeDocument(id, fileUrl);
      setVisa(await VisaService.getForClient(client!.id));
      toast({ title: "Requirement removed", tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't remove that",
        description: err instanceof Error ? err.message : String(err),
        tone: "error",
      });
    } finally {
      setDocBusy(false);
    }
  }

  const approvedDocs = visa?.documents.filter((d) => d.status === "verified").length ?? 0;

  return (
    <Sheet open={!!client} onClose={onClose} label={client ? client.full_name : "Client"}>
      {client && (
        <div className="space-y-6 pt-1">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3.5">
              <Avatar name={client.full_name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="nx-display truncate text-xl font-semibold" style={{ color: "var(--nx-text)" }}>
                  {client.full_name}
                </p>
                <p className="truncate text-xs" style={{ color: "var(--nx-faint)" }}>
                  {client.country_interest?.length ? client.country_interest.join(" · ") : "No destination yet"}
                  {client.consultant ? ` · with ${client.consultant.full_name}` : ""}
                </p>
              </div>
              <StatusBadge label={STAGE_META[stage].label} tone={STAGE_META[stage].tone} />
            </div>
            <JourneyStrip stage={stage} className="mt-3.5" />
          </div>

          {/* Contact actions */}
          <div className="flex gap-2">
            {client.whatsapp && (
              <>
                <a href={`tel:${client.whatsapp}`} className="crm-chip crm-press flex-1 justify-center" style={{ height: "2.4rem" }}>
                  <Phone className="h-4 w-4" /> Call
                </a>
                <a
                  href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="crm-chip crm-press flex-1 justify-center"
                  style={{ height: "2.4rem", color: "var(--nx-positive)", borderColor: "rgba(70,177,125,0.35)", background: "var(--nx-positive-soft)" }}
                >
                  <MessageSquare className="h-4 w-4" /> WhatsApp
                </a>
              </>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="crm-chip crm-press flex-1 justify-center" style={{ height: "2.4rem" }}>
                <Mail className="h-4 w-4" /> Email
              </a>
            )}
          </div>

          {/* Stage mover */}
          <section>
            <h4 className="crm-section-title mb-2">Move along the journey</h4>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {ALL_STAGES.map((s) => (
                <button
                  key={s}
                  className="crm-chip crm-press justify-center"
                  data-active={s === stage}
                  onClick={() => moveStage(s)}
                >
                  {STAGE_META[s].label}
                </button>
              ))}
            </div>
          </section>

          {/* Academics */}
          <section>
            <h4 className="crm-section-title mb-2">Profile</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
              <Fact icon={GraduationCap} label="Degree" value={client.degree ? DEGREE_META[client.degree] : "—"} />
              <Fact icon={GraduationCap} label="IELTS" value={client.ielts_score != null ? String(client.ielts_score) : "—"} />
              <Fact icon={GraduationCap} label="SSC" value={client.ssc_result ?? "—"} />
              <Fact icon={GraduationCap} label="HSC" value={client.hsc_result ?? "—"} />
            </div>
            {client.notes && (
              <p className="mt-3 rounded-xl px-3.5 py-3 text-sm leading-relaxed" style={{ background: "var(--nx-panel-2)", color: "var(--nx-muted)" }}>
                {client.notes}
              </p>
            )}
          </section>

          {/* Meetings */}
          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h4 className="crm-section-title">Meetings</h4>
              {/* Any staff member can book, mentor or not — the person taking a
                  WhatsApp enquiry is usually not the one who takes the call. */}
              <button
                className="nx-btn nx-btn-ghost text-xs"
                onClick={() => setBookingOpen(true)}
              >
                <CalendarPlus className="h-3.5 w-3.5" /> Book a mentor
              </button>
            </div>
            <div className="space-y-1.5">
              {meetings.length === 0 && (
                <p className="text-sm" style={{ color: "var(--nx-faint)" }}>
                  No meetings yet — book the first one below.
                </p>
              )}
              {meetings.map((m) => (
                <div key={m.id} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--nx-panel-2)" }}>
                  <div className="min-w-0 flex-1">
                    <p className="crm-num text-xs font-semibold" style={{ color: "var(--nx-text)" }}>
                      {m.scheduled_at
                        ? new Date(m.scheduled_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "Unscheduled"}
                    </p>
                    <p className="truncate text-[0.7rem]" style={{ color: "var(--nx-faint)" }}>
                      {m.consultant?.full_name ?? "No consultant"}
                    </p>
                  </div>
                  <select
                    className={miniInput}
                    style={{ width: "7.2rem" }}
                    value={m.status}
                    onChange={(e) => setMeetingStatus(m.id, e.target.value as MeetingStatus)}
                    aria-label="Meeting status"
                  >
                    {MEETING_STATUSES.map((s) => (
                      <option key={s} value={s}>{MEETING_STATUS_META[s].label}</option>
                    ))}
                  </select>
                  <button
                    className="crm-press flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ color: "var(--nx-danger)" }}
                    onClick={() => removeMeeting(m.id)}
                    aria-label="Remove meeting"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={addMeeting} className="mt-2 flex gap-1.5">
              <input
                type="datetime-local"
                className={`${miniInput} min-w-0 flex-1`}
                value={mDate}
                onChange={(e) => setMDate(e.target.value)}
                aria-label="Meeting time"
              />
              <select
                className={miniInput}
                style={{ width: "8.5rem" }}
                value={mConsultant}
                onChange={(e) => setMConsultant(e.target.value)}
                aria-label="Consultant"
              >
                <option value="">Consultant…</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
              <button className="nx-btn nx-btn-primary shrink-0 px-3 py-1.5" disabled={busy} aria-label="Add meeting">
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </section>

          {/* Visa file */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="crm-section-title">Visa file</h4>
              {visa && (
                <span className="crm-num text-[0.7rem] font-semibold" style={{ color: "var(--nx-faint)" }}>
                  {approvedDocs}/{visa.documents.length} verified
                </span>
              )}
            </div>
            {!visa ? (
              <button className="crm-chip crm-press w-full justify-center" style={{ height: "2.6rem" }} onClick={openVisaFile} disabled={busy}>
                <Plane className="h-4 w-4" /> Open visa file with standard checklist
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    className={`${miniInput} flex-1`}
                    value={visa.status}
                    onChange={(e) => setVisaStatus(e.target.value as VisaStatus)}
                    aria-label="Visa status"
                  >
                    {VISA_STATUSES.map((s) => (
                      <option key={s} value={s}>{VISA_STATUS_META[s].label}</option>
                    ))}
                  </select>
                  <StatusBadge label={VISA_STATUS_META[visa.status].label} tone={VISA_STATUS_META[visa.status].tone} />
                </div>
                <div className="space-y-1">
                  {visa.documents.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ background: "var(--nx-panel-2)" }}>
                      <span className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--nx-text)" }}>
                        {d.document_name}
                        {d.is_custom && (
                          <span
                            className="ml-1.5 rounded px-1 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider"
                            style={{ background: "var(--nx-accent-soft)", color: "var(--nx-accent-2)" }}
                            title="Added by staff, not part of the standard checklist"
                          >
                            Added
                          </span>
                        )}
                      </span>
                      {d.file_url && (
                        <button
                          className="crm-press flex h-6 items-center gap-1 rounded-md px-1.5 text-[0.65rem] font-semibold"
                          style={{ color: "var(--nx-accent-2)", background: "var(--nx-accent-soft)" }}
                          onClick={async () => {
                            try {
                              const url = await VisaService.getSignedUrl(supabase, d.file_url!, 3600);
                              window.open(url, "_blank");
                            } catch { /* silent */ }
                          }}
                          title="View uploaded file"
                        >
                          <ExternalLink className="h-3 w-3" /> View
                        </button>
                      )}
                      <select
                        className={miniInput}
                        style={{ width: "6.8rem" }}
                        value={d.status}
                        onChange={(e) => setDocStatus(d.id, e.target.value as VisaDocStatus)}
                        aria-label={`${d.document_name} status`}
                      >
                        {DOC_STATUSES.map((s) => (
                          <option key={s} value={s}>{VISA_DOC_STATUS_META[s].label}</option>
                        ))}
                      </select>
                      <button
                        className="crm-press flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                        style={{ color: "var(--nx-faint)" }}
                        onClick={() => removeDoc(d.id, d.document_name, d.file_url)}
                        disabled={docBusy}
                        aria-label={`Remove ${d.document_name}`}
                        title="Remove this requirement"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add a requirement */}
                  <div className="flex items-center gap-2 pt-1.5">
                    <input
                      className={miniInput}
                      style={{ flex: 1 }}
                      placeholder="Add a requirement, e.g. Police clearance"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addDoc()}
                      aria-label="New document requirement"
                    />
                    <button
                      className="nx-btn nx-btn-ghost text-xs"
                      onClick={addDoc}
                      disabled={docBusy || newDocName.trim().length < 2}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      <BookForClient
        open={bookingOpen}
        clientId={client?.id ?? null}
        clientName={client?.full_name ?? ""}
        onClose={() => setBookingOpen(false)}
        onBooked={onChanged}
      />
    </Sheet>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--nx-faint)" }} />
      <div className="min-w-0">
        <p className="text-[0.68rem]" style={{ color: "var(--nx-faint)" }}>{label}</p>
        <p className="truncate text-sm" style={{ color: "var(--nx-text)" }}>{value}</p>
      </div>
    </div>
  );
}
