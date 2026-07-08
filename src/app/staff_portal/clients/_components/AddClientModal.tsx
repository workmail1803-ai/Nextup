"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Loader2, Plus, UserPlus } from "lucide-react";
import { Modal, useToast } from "@/components/internal";
import { ClientService } from "@/lib/services/client.service";
import { MeetingService } from "@/lib/services/meeting.service";
import { StaffService } from "@/lib/services/staff.service";
import type { Staff } from "@/lib/types/staff";
import type { ClientStage, DegreeLevel } from "@/lib/types/client";
import { STAGE_META } from "@/lib/types/client";

const COUNTRIES = ["Italy", "Lithuania", "Germany", "Poland", "Hungary"];
const STAGES = Object.keys(STAGE_META) as ClientStage[];

interface ClientForm {
  full_name: string;
  country_interest: string[];
  degree: DegreeLevel | "";
  email: string;
  facebook_id: string;
  whatsapp: string;
  stage: ClientStage;
  notes: string;
  ssc_result: string;
  ssc_year: string;
  hsc_result: string;
  hsc_year: string;
  ielts_score: string;
  // meeting fields
  meeting_mentor_id: string;
  meeting_scheduled_at: string;
  meeting_comments: string;
}

const EMPTY: ClientForm = {
  full_name: "",
  country_interest: [],
  degree: "",
  email: "",
  facebook_id: "",
  whatsapp: "",
  stage: "lead",
  notes: "",
  ssc_result: "",
  ssc_year: "",
  hsc_result: "",
  hsc_year: "",
  ielts_score: "",
  meeting_mentor_id: "",
  meeting_scheduled_at: "",
  meeting_comments: "",
};

export function AddClientModal({
  open,
  staffId,
  onClose,
  onCreated,
}: {
  open: boolean;
  staffId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<ClientForm>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  // Fetch staff/mentors list when modal opens
  useEffect(() => {
    if (!open) return;
    StaffService.list().then(setStaffList).catch(() => {});
  }, [open]);

  function reset() {
    setForm({ ...EMPTY });
  }

  async function handleSave() {
    if (!form.full_name.trim()) {
      toast({ title: "Name is required", tone: "error" });
      return;
    }
    setSaving(true);
    try {
      // 1. Create the client
      const newClient = await ClientService.create({
        full_name: form.full_name.trim(),
        country_interest: form.country_interest,
        degree: form.degree || null,
        email: form.email.trim() || null,
        facebook_id: form.facebook_id.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        stage: form.stage,
        // Mentor is *assigned* (not auto-self). Falls back to the pool (null).
        primary_consultant_id: form.meeting_mentor_id || null,
        // The signed-in staff member is the referrer ("forwarded by").
        added_by_staff_id: staffId,
        notes: form.notes.trim() || null,
        ssc_result: form.ssc_result.trim() || null,
        ssc_year: form.ssc_year ? Number(form.ssc_year) : null,
        hsc_result: form.hsc_result.trim() || null,
        hsc_year: form.hsc_year ? Number(form.hsc_year) : null,
        ielts_score: form.ielts_score ? Number(form.ielts_score) : null,
      });

      // 2. If meeting was scheduled, create a client_meetings row
      if (form.meeting_scheduled_at) {
        await MeetingService.create({
          client_id: newClient.id,
          consultant_id: form.meeting_mentor_id || null,
          forwarded_by_staff_id: staffId,
          scheduled_at: new Date(form.meeting_scheduled_at).toISOString(),
          status: "scheduled",
          comments: form.meeting_comments.trim() || null,
        });
      }

      const meetingNote = form.meeting_scheduled_at ? " with a meeting scheduled" : "";
      toast({
        title: "Client added",
        description: `${form.full_name.trim()} has been created${meetingNote}.`,
        tone: "success",
      });
      reset();
      onCreated();
      onClose();
    } catch {
      toast({ title: "Couldn't add client", description: "Please try again.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  const hasMeetingFields = !!(form.meeting_scheduled_at || form.meeting_mentor_id);

  return (
    <Modal
      open={open}
      size="lg"
      onClose={handleClose}
      title={
        <span className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" style={{ color: "var(--nx-accent-2)" }} />
          Add new client
        </span>
      }
      description="You'll be recorded as the referrer — assign a mentor for their meeting."
      footer={
        <>
          <button className="nx-btn nx-btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button className="nx-btn nx-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add client
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Name + Degree */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="nx-label">Full name *</label>
            <input
              className="nx-input"
              placeholder="e.g. Fatima Rahman"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="nx-label">Degree</label>
            <select
              className="nx-input"
              value={form.degree}
              onChange={(e) => setForm({ ...form, degree: e.target.value as DegreeLevel | "" })}
            >
              <option value="">—</option>
              <option value="bachelors">Bachelor&apos;s</option>
              <option value="masters">Master&apos;s</option>
            </select>
          </div>
        </div>

        {/* Countries */}
        <div>
          <label className="nx-label">Countries of interest</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {COUNTRIES.map((co) => {
              const on = form.country_interest.includes(co);
              return (
                <button
                  key={co}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      country_interest: on
                        ? form.country_interest.filter((x) => x !== co)
                        : [...form.country_interest, co],
                    })
                  }
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200"
                  style={{
                    background: on ? "var(--nx-accent-soft)" : "var(--nx-panel-2)",
                    color: on ? "var(--nx-accent-2)" : "var(--nx-muted)",
                    border: `1px solid ${on ? "var(--nx-accent-2)" : "var(--nx-edge)"}`,
                  }}
                >
                  {co}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="nx-label">Email</label>
            <input
              className="nx-input"
              type="email"
              placeholder="client@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="nx-label">WhatsApp</label>
            <input
              className="nx-input"
              placeholder="+880 1XXX XXXXXX"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </div>
        </div>

        {/* Facebook + Stage */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="nx-label">Facebook ID</label>
            <input
              className="nx-input"
              placeholder="facebook.com/..."
              value={form.facebook_id}
              onChange={(e) => setForm({ ...form, facebook_id: e.target.value })}
            />
          </div>
          <div>
            <label className="nx-label">Stage</label>
            <select
              className="nx-input"
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value as ClientStage })}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_META[s].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Academic — SSC & HSC */}
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--nx-panel-2)", border: "1px solid var(--nx-edge)" }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--nx-faint)" }}>
            Academic results
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="nx-label">SSC Result</label>
              <input
                className="nx-input"
                placeholder="e.g. 5.00 or A+"
                value={form.ssc_result}
                onChange={(e) => setForm({ ...form, ssc_result: e.target.value })}
              />
            </div>
            <div>
              <label className="nx-label">SSC Year</label>
              <input
                className="nx-input"
                type="number"
                placeholder="e.g. 2018"
                min={2000}
                max={2099}
                value={form.ssc_year}
                onChange={(e) => setForm({ ...form, ssc_year: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="nx-label">HSC Result</label>
              <input
                className="nx-input"
                placeholder="e.g. 5.00 or A+"
                value={form.hsc_result}
                onChange={(e) => setForm({ ...form, hsc_result: e.target.value })}
              />
            </div>
            <div>
              <label className="nx-label">HSC Year</label>
              <input
                className="nx-input"
                type="number"
                placeholder="e.g. 2020"
                min={2000}
                max={2099}
                value={form.hsc_year}
                onChange={(e) => setForm({ ...form, hsc_year: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* IELTS */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="nx-label">IELTS Score</label>
            <input
              className="nx-input"
              type="number"
              step="0.5"
              min={0}
              max={9}
              placeholder="e.g. 6.5"
              value={form.ielts_score}
              onChange={(e) => setForm({ ...form, ielts_score: e.target.value })}
            />
          </div>
        </div>

        {/* Schedule meeting */}
        <div
          className="rounded-xl p-4"
          style={{
            background: hasMeetingFields ? "var(--nx-accent-soft)" : "var(--nx-panel-2)",
            border: `1px solid ${hasMeetingFields ? "var(--nx-accent-2)" : "var(--nx-edge)"}`,
            transition: "all 0.2s ease",
          }}
        >
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: hasMeetingFields ? "var(--nx-accent-2)" : "var(--nx-faint)" }}>
            <CalendarPlus className="h-3.5 w-3.5" />
            Schedule a meeting (optional)
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="nx-label">Mentor / Consultant</label>
              <select
                className="nx-input"
                value={form.meeting_mentor_id}
                onChange={(e) => setForm({ ...form, meeting_mentor_id: e.target.value })}
              >
                <option value="">— Select mentor —</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}{s.title ? ` (${s.title})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="nx-label">Meeting date &amp; time</label>
              <input
                className="nx-input"
                type="datetime-local"
                value={form.meeting_scheduled_at}
                onChange={(e) => setForm({ ...form, meeting_scheduled_at: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="nx-label">Meeting comments</label>
            <textarea
              className="nx-input"
              rows={2}
              placeholder="e.g. First consultation, discuss country options…"
              value={form.meeting_comments}
              onChange={(e) => setForm({ ...form, meeting_comments: e.target.value })}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="nx-label">Notes</label>
          <textarea
            className="nx-input"
            rows={3}
            placeholder="Any relevant notes about this client…"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  );
}
