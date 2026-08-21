"use client";

// =============================================================================
// PortalNotifications — the bell in the file header.
//
// Messages come FROM staff TO the student: a receipt issued, a document
// approved, a note from their consultant. Marking them read is the only write a
// student has here, and it happens through an RPC scoped to their own rows.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Loader2, Receipt, FileCheck2, CalendarDays, MessageSquare } from "lucide-react";
import { portalSupabase } from "@/lib/portal/supabase-portal";
import { staffSupabase } from "@/lib/auth/supabase-staff";
import { usePortal } from "@/lib/portal/PortalContext";

interface Note {
  id: string;
  kind: "receipt" | "document" | "meeting" | "stage" | "message";
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

const ICON = {
  receipt: Receipt,
  document: FileCheck2,
  meeting: CalendarDays,
  stage: MessageSquare,
  message: MessageSquare,
};

function ago(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export function PortalNotifications() {
  const { client, preview } = usePortal();
  const sb = preview ? staffSupabase : portalSupabase;

  const [notes, setNotes] = useState<Note[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!client?.id) return;
    const { data } = await sb
      .from("client_notifications")
      .select("id, kind, title, body, link, read_at, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setNotes((data as Note[]) ?? []);
  }, [client?.id, sb]);

  useEffect(() => {
    const t = setTimeout(() => {
      load().catch(() => {});
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  // Close on an outside tap — a panel that traps you is worse than no panel.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const unread = notes.filter((n) => !n.read_at).length;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setLoading(true);
      try {
        // Marked read on open, not on tap: the student has now seen them, and
        // a badge that lingers after you have looked is just noise.
        if (!preview) await portalSupabase.rpc("portal_mark_notifications_read");
        setNotes((p) => p.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        className="pf-press relative flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ color: unread > 0 ? "var(--pf-seal)" : "var(--pf-vellum-3)" }}
        onClick={toggle}
        aria-label={unread > 0 ? `${unread} unread messages` : "Messages"}
      >
        <Bell className="h-4 w-4" strokeWidth={1.9} />
        {unread > 0 && (
          <span
            className="pf-mono absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.55rem] font-bold"
            style={{ background: "var(--pf-seal)", color: "#14181f" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[19rem] overflow-hidden rounded-xl"
          style={{
            background: "var(--pf-ink-2)",
            border: "1px solid var(--pf-rule-2)",
            boxShadow: "0 24px 60px -20px rgba(0,0,0,0.7)",
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--pf-rule)" }}>
            <p className="pf-label">Messages</p>
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {loading && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--pf-vellum-3)" }} />
              </div>
            )}
            {!loading && notes.length === 0 && (
              <p className="px-4 py-8 text-center text-[0.8125rem]" style={{ color: "var(--pf-vellum-3)" }}>
                Nothing yet. Updates from your consultant land here.
              </p>
            )}
            {notes.map((n, i) => {
              const Icon = ICON[n.kind] ?? MessageSquare;
              const inner = (
                <>
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "var(--pf-seal-soft)", color: "var(--pf-seal)" }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.8125rem] font-medium">{n.title}</span>
                    {n.body && (
                      <span className="mt-0.5 block text-[0.72rem] leading-snug" style={{ color: "var(--pf-vellum-2)" }}>
                        {n.body}
                      </span>
                    )}
                    <span className="pf-mono mt-1 block text-[0.6rem]" style={{ color: "var(--pf-vellum-3)" }}>
                      {ago(n.created_at)}
                    </span>
                  </span>
                </>
              );
              const cls = "flex w-full items-start gap-2.5 px-4 py-3 text-left";
              const style = i === 0 ? undefined : { borderTop: "1px solid var(--pf-rule)" };
              return n.link ? (
                <Link key={n.id} href={n.link} className={cls} style={style} onClick={() => setOpen(false)}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id} className={cls} style={style}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
