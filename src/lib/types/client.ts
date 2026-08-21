// =============================================================================
// Client CRM domain types — mirror clients / client_meetings / client_visa /
// visa_document_items (migration 0003).
// =============================================================================

import type { Staff } from "./staff";

export type DegreeLevel = "bachelors" | "masters";
export type ClientStage =
  | "lead"
  | "meeting"
  | "file_open"
  | "offer"
  | "visa"
  | "enrolled"
  | "closed";
export type MeetingStatus =
  | "scheduled"
  | "completed"
  | "no_show"
  | "follow_up"
  | "cancelled";
export type VisaStatus =
  | "not_started"
  | "collecting"
  | "ready"
  | "submitted"
  | "approved"
  | "rejected";
export type VisaDocStatus = "pending" | "received" | "verified" | "na";

export interface Client {
  id: string;
  full_name: string;
  country_interest: string[];
  degree: DegreeLevel | null;
  email: string | null;
  facebook_id: string | null;
  whatsapp: string | null;
  stage: ClientStage;
  primary_consultant_id: string | null;
  /** Staff who created/forwarded this client (distinct from the mentor). */
  added_by_staff_id: string | null;
  notes: string | null;
  ssc_result: string | null;
  ssc_year: number | null;
  hsc_result: string | null;
  hsc_year: number | null;
  ielts_score: number | null;
  created_at: string;
  updated_at: string;
}

/** Client with the embedded consultant + meetings (PostgREST resource embedding). */
export interface ClientWithRelations extends Client {
  consultant: Pick<Staff, "id" | "full_name"> | null;
  added_by: Pick<Staff, "id" | "full_name"> | null;
  client_meetings: { scheduled_at: string | null; status: MeetingStatus }[];
}

export interface ClientMeeting {
  id: string;
  client_id: string;
  scheduled_at: string | null;
  consultant_id: string | null;
  consultant_raw: string | null;
  forwarded_by_staff_id: string | null;
  status: MeetingStatus;
  comments: string | null;
  reminder: string | null;
  follow_up_comments: string | null;
  follow_up_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientVisa {
  id: string;
  client_id: string;
  vfs_appointment_date: string | null;
  status: VisaStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisaDocumentItem {
  id: string;
  visa_id: string;
  document_name: string;
  status: VisaDocStatus;
  note: string | null;
  file_url: string | null;
  /** False = part of the standard embassy checklist. True = added by staff for
   *  this student specifically, and labelled as such in their portal. */
  is_custom: boolean;
  added_by_staff_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ClientInsert = {
  full_name: string;
  country_interest?: string[];
  degree?: DegreeLevel | null;
  email?: string | null;
  facebook_id?: string | null;
  whatsapp?: string | null;
  stage?: ClientStage;
  primary_consultant_id?: string | null;
  added_by_staff_id?: string | null;
  notes?: string | null;
  ssc_result?: string | null;
  ssc_year?: number | null;
  hsc_result?: string | null;
  hsc_year?: number | null;
  ielts_score?: number | null;
};
export type ClientUpdate = Partial<ClientInsert>;

export type MeetingInsert = {
  client_id: string;
  scheduled_at?: string | null;
  consultant_id?: string | null;
  consultant_raw?: string | null;
  forwarded_by_staff_id?: string | null;
  status?: MeetingStatus;
  comments?: string | null;
  reminder?: string | null;
  follow_up_comments?: string | null;
  follow_up_note?: string | null;
};
export type MeetingUpdate = Partial<Omit<MeetingInsert, "client_id">>;

// -----------------------------------------------------------------------------
// Display metadata (labels + badge tones) — single source of truth for the UI.
// -----------------------------------------------------------------------------

import type { BadgeTone } from "@/components/internal/StatusBadge";

export const STAGE_META: Record<ClientStage, { label: string; tone: BadgeTone }> = {
  lead: { label: "Lead", tone: "neutral" },
  meeting: { label: "Meeting", tone: "info" },
  file_open: { label: "File Open", tone: "accent" },
  offer: { label: "Offer", tone: "warning" },
  visa: { label: "Visa", tone: "accent" },
  enrolled: { label: "Enrolled", tone: "positive" },
  closed: { label: "Closed", tone: "neutral" },
};

export const MEETING_STATUS_META: Record<MeetingStatus, { label: string; tone: BadgeTone }> = {
  scheduled: { label: "Scheduled", tone: "info" },
  completed: { label: "Completed", tone: "positive" },
  no_show: { label: "No show", tone: "danger" },
  follow_up: { label: "Follow up", tone: "warning" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const VISA_STATUS_META: Record<VisaStatus, { label: string; tone: BadgeTone }> = {
  not_started: { label: "Not started", tone: "neutral" },
  collecting: { label: "Collecting", tone: "info" },
  ready: { label: "Ready", tone: "accent" },
  submitted: { label: "Submitted", tone: "warning" },
  approved: { label: "Approved", tone: "positive" },
  rejected: { label: "Rejected", tone: "danger" },
};

export const VISA_DOC_STATUS_META: Record<VisaDocStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending", tone: "neutral" },
  received: { label: "Received", tone: "info" },
  verified: { label: "Verified", tone: "positive" },
  na: { label: "N/A", tone: "neutral" },
};

export const DEGREE_META: Record<DegreeLevel, string> = {
  bachelors: "Bachelor's",
  masters: "Master's",
};
