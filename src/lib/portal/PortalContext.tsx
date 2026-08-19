"use client";

import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { portalSupabase } from "./supabase-portal";
// Preview reads another student's file, which is a STAFF capability — so it
// runs on the staff client. It used the anon client until migration 0012
// closed anon access to `clients`, which is exactly the read it depends on.
import { staffSupabase } from "@/lib/auth/supabase-staff";
import type { Client, ClientMeeting } from "@/lib/types/client";

export interface VisaDoc {
  id: string;
  document_name: string;
  status: "pending" | "received" | "verified" | "na";
  file_url: string | null;
  sort_order: number;
}
export interface PortalVisa {
  status: "not_started" | "collecting" | "ready" | "submitted" | "approved" | "rejected";
  vfs_appointment_date: string | null;
  documents: VisaDoc[];
}
/** One recorded (or reconstructed) move between stages. */
export interface StageEvent {
  to_stage: string;
  occurred_at: string;
  /** 'inferred' rows were rebuilt from created_at/updated_at, not observed.
   *  The UI must not present them as facts about timing. */
  source: "recorded" | "inferred";
}

/** Aggregate waiting time across other students. Never identifies anyone, and
 *  is null whenever the corpus is too small or too degenerate to be honest. */
export interface StageBenchmark {
  sample_size: number;
  p25_days: number;
  median_days: number;
  p75_days: number;
}

export interface PortalMentor {
  id: string;
  full_name: string;
  title: string | null;
  avatar_url: string | null;
}

type Status = "loading" | "unauthed" | "no-file" | "ready";

interface PortalValue {
  status: Status;
  session: Session | null;
  client: Client | null;
  meetings: ClientMeeting[];
  visa: PortalVisa | null;
  mentor: PortalMentor | null;
  stageEvents: StageEvent[];
  benchmark: StageBenchmark | null;
  /** True when viewing via the dev-only preview bypass (no real auth). */
  preview: boolean;
  refresh: () => void;
  signOut: () => Promise<void>;
}

const PortalCtx = createContext<PortalValue | null>(null);

const PREVIEW_KEY = "nx_portal_preview";
const isDev = process.env.NODE_ENV !== "production";


/**
 * Stage history + the waiting-time benchmark for one client.
 *
 * The benchmark comes from an RPC rather than a table read on purpose: the
 * function is SECURITY DEFINER and returns aggregates only, so a student can
 * learn "this stage usually takes 22-41 days" without their query ever touching
 * another student's record. It returns no row at all when the corpus is too
 * small or too degenerate — in which case we show no estimate.
 */
async function loadStageContext(
  sb: typeof staffSupabase,
  clientId: string,
  stage: string,
): Promise<{ events: StageEvent[]; benchmark: StageBenchmark | null }> {
  const [eventsRes, benchRes] = await Promise.all([
    sb
      .from("client_stage_events")
      .select("to_stage, occurred_at, source")
      .eq("client_id", clientId)
      .order("occurred_at", { ascending: true }),
    sb.rpc("portal_stage_benchmark", { p_stage: stage, p_metric: "in_stage" }),
  ]);

  const bench = Array.isArray(benchRes.data) ? benchRes.data[0] : null;
  return {
    events: (eventsRes.data as StageEvent[]) ?? [],
    benchmark: (bench as StageBenchmark) ?? null,
  };
}

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [meetings, setMeetings] = useState<ClientMeeting[]>([]);
  const [visa, setVisa] = useState<PortalVisa | null>(null);
  const [mentor, setMentor] = useState<PortalMentor | null>(null);
  const [stageEvents, setStageEvents] = useState<StageEvent[]>([]);
  const [benchmark, setBenchmark] = useState<StageBenchmark | null>(null);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);
  const claimedRef = useRef(false);

  // --- Dev-only preview state ---
  const [previewResolved, setPreviewResolved] = useState(!isDev);
  const [previewClientId, setPreviewClientId] = useState<string | null>(null);
  const [previewReady, setPreviewReady] = useState(false);

  // Resolve whether we're in preview (from ?as= or a prior sessionStorage pick).
  useEffect(() => {
    if (!isDev) return;
    const t = setTimeout(() => {
      const asParam = new URLSearchParams(window.location.search).get("as");
      if (asParam) sessionStorage.setItem(PREVIEW_KEY, asParam);
      setPreviewClientId(asParam || sessionStorage.getItem(PREVIEW_KEY));
      setPreviewResolved(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Load a client's data for preview via the anon client (dev only).
  const loadPreview = useCallback(async (id: string) => {
    const { data: record } = await staffSupabase.from("clients").select("*").eq("id", id).maybeSingle();
    if (!record) {
      setClient(null);
      setPreviewReady(true);
      return;
    }
    const [meetingsRes, visaRes, mentorRes] = await Promise.all([
      staffSupabase.from("client_meetings").select("*").eq("client_id", id).order("scheduled_at", { ascending: false }),
      staffSupabase.from("client_visa").select("status, vfs_appointment_date, documents:visa_document_items(id, document_name, status, file_url, sort_order)").eq("client_id", id).maybeSingle(),
      (record as Client).primary_consultant_id
        ? staffSupabase.from("public_mentors").select("*").eq("id", (record as Client).primary_consultant_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const v = visaRes.data as PortalVisa | null;
    if (v) v.documents = [...(v.documents ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const stageCtx = await loadStageContext(staffSupabase, id, (record as Client).stage);
    setStageEvents(stageCtx.events);
    setBenchmark(stageCtx.benchmark);
    setClient(record as Client);
    setMeetings((meetingsRes.data as ClientMeeting[]) ?? []);
    setVisa(v);
    setMentor((mentorRes.data as PortalMentor) ?? null);
    setPreviewReady(true);
  }, []);

  useEffect(() => {
    if (!previewClientId) return;
    const t = setTimeout(() => {
      loadPreview(previewClientId).catch(() => setPreviewReady(true));
    }, 0);
    return () => clearTimeout(t);
  }, [previewClientId, loadPreview]);

  // --- Real auth session (skipped while previewing) ---
  useEffect(() => {
    portalSupabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthResolved(true);
    });
    const { data: sub } = portalSupabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthResolved(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadFile = useCallback(async (email: string, uid: string) => {
    const { data: found } = await portalSupabase
      .from("clients")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    const record = (found as (Client & { auth_user_id?: string | null }) | null) ?? null;
    if (!record) {
      setClient(null);
      setMeetings([]);
      setVisa(null);
      setMentor(null);
      setStageEvents([]);
      setBenchmark(null);
      setFetchedFor(uid);
      return;
    }
    // AWAITED, not fire-and-forget. Every read below is gated on
    // `auth_user_id = auth.uid()` in RLS, so racing the claim against them meant
    // a student's very first sign-in showed an empty portal — no meetings, no
    // checklist — until they happened to reload.
    if (!claimedRef.current && !record.auth_user_id) {
      claimedRef.current = true;
      const { error: claimErr } = await portalSupabase
        .from("clients")
        .update({ auth_user_id: uid })
        .eq("id", record.id);
      if (claimErr) console.warn("portal claim failed:", claimErr.message);
    }
    const [meetingsRes, visaRes, mentorRes] = await Promise.all([
      portalSupabase.from("client_meetings").select("*").eq("client_id", record.id).order("scheduled_at", { ascending: false }),
      portalSupabase.from("client_visa").select("status, vfs_appointment_date, documents:visa_document_items(id, document_name, status, file_url, sort_order)").eq("client_id", record.id).maybeSingle(),
      record.primary_consultant_id
        ? portalSupabase.from("public_mentors").select("*").eq("id", record.primary_consultant_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const v = visaRes.data as PortalVisa | null;
    if (v) v.documents = [...(v.documents ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const stageCtx = await loadStageContext(portalSupabase, record.id, record.stage);
    setStageEvents(stageCtx.events);
    setBenchmark(stageCtx.benchmark);
    setClient(record);
    setMeetings((meetingsRes.data as ClientMeeting[]) ?? []);
    setVisa(v);
    setMentor((mentorRes.data as PortalMentor) ?? null);
    setFetchedFor(uid);
  }, []);

  useEffect(() => {
    if (previewClientId) return; // preview takes over
    if (!authResolved || !session?.user?.email) return;
    if (fetchedFor === session.user.id) return;
    const email = session.user.email;
    const uid = session.user.id;
    const t = setTimeout(() => {
      loadFile(email, uid).catch(() => setFetchedFor(uid));
    }, 0);
    return () => clearTimeout(t);
  }, [previewClientId, authResolved, session, fetchedFor, loadFile]);

  const refresh = useCallback(() => {
    if (previewClientId) {
      setPreviewReady(false);
      loadPreview(previewClientId).catch(() => setPreviewReady(true));
    } else {
      setFetchedFor(null);
    }
  }, [previewClientId, loadPreview]);

  const signOut = useCallback(async () => {
    if (previewClientId) {
      sessionStorage.removeItem(PREVIEW_KEY);
      window.location.href = "/portal/preview";
      return;
    }
    await portalSupabase.auth.signOut();
    claimedRef.current = false;
    setClient(null);
    setMeetings([]);
    setVisa(null);
    setMentor(null);
    setStageEvents([]);
    setBenchmark(null);
    setFetchedFor(null);
  }, [previewClientId]);

  const status: Status =
    isDev && !previewResolved
      ? "loading"
      : previewClientId
        ? !previewReady
          ? "loading"
          : client
            ? "ready"
            : "no-file"
        : !authResolved
          ? "loading"
          : !session?.user?.email
            ? "unauthed"
            : fetchedFor !== session.user.id
              ? "loading"
              : client
                ? "ready"
                : "no-file";

  return (
    <PortalCtx.Provider
      value={{ status, session, client, meetings, visa, mentor, stageEvents, benchmark, preview: !!previewClientId, refresh, signOut }}
    >
      {children}
    </PortalCtx.Provider>
  );
}

export function usePortal(): PortalValue {
  const ctx = useContext(PortalCtx);
  if (!ctx) throw new Error("usePortal must be used inside <PortalProvider>");
  return ctx;
}
