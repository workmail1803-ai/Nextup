// Slate-theme display metadata for client CRM enums (labels + Badge tones).
import type { Tone } from "./AdminUI";
import type {
  ClientStage,
  DegreeLevel,
  MeetingStatus,
  VisaDocStatus,
  VisaStatus,
} from "@/lib/types/client";

export const STAGE: Record<ClientStage, { label: string; tone: Tone }> = {
  lead: { label: "Lead", tone: "slate" },
  meeting: { label: "Meeting", tone: "blue" },
  file_open: { label: "File Open", tone: "amber" },
  offer: { label: "Offer", tone: "purple" },
  visa: { label: "Visa", tone: "amber" },
  enrolled: { label: "Enrolled", tone: "green" },
  closed: { label: "Closed", tone: "slate" },
};

export const MEETING: Record<MeetingStatus, { label: string; tone: Tone }> = {
  scheduled: { label: "Scheduled", tone: "blue" },
  completed: { label: "Completed", tone: "green" },
  no_show: { label: "No show", tone: "red" },
  follow_up: { label: "Follow up", tone: "amber" },
  cancelled: { label: "Cancelled", tone: "slate" },
};

export const VISA: Record<VisaStatus, { label: string; tone: Tone }> = {
  not_started: { label: "Not started", tone: "slate" },
  collecting: { label: "Collecting", tone: "blue" },
  ready: { label: "Ready", tone: "amber" },
  submitted: { label: "Submitted", tone: "purple" },
  approved: { label: "Approved", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
};

export const DOC: Record<VisaDocStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "slate" },
  received: { label: "Received", tone: "blue" },
  verified: { label: "Verified", tone: "green" },
  na: { label: "N/A", tone: "slate" },
};

export const DEGREE: Record<DegreeLevel, string> = {
  bachelors: "Bachelor's",
  masters: "Master's",
};

export const COUNTRIES = ["Italy", "Lithuania", "Germany", "Poland", "Hungary"];

export const STAGE_KEYS: ClientStage[] = [
  "lead", "meeting", "file_open", "offer", "visa", "enrolled", "closed",
];

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
