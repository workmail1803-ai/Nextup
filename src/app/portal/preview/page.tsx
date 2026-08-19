"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Search } from "lucide-react";
import { Avatar, StatusBadge } from "@/components/internal";
import { JourneyStrip } from "@/components/crm/JourneyStrip";
import { staffSupabase } from "@/lib/auth/supabase-staff";
import { STAGE_META, type ClientStage } from "@/lib/types/client";

interface Row {
  id: string;
  full_name: string;
  email: string | null;
  stage: ClientStage;
  country_interest: string[] | null;
}

const isDev = process.env.NODE_ENV !== "production";

/**
 * Dev-only preview picker. Opens any student's portal without signing in, so
 * the client experience can be checked before Supabase Auth is configured.
 * Disabled entirely in production.
 */
export default function PortalPreviewPicker() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isDev) return;
    const t = setTimeout(() => {
      staffSupabase
        .from("clients")
        .select("id, full_name, email, stage, country_interest")
        .order("full_name")
        .then(({ data }) => {
          setRows((data as Row[]) ?? []);
          setLoading(false);
        });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.full_name} ${r.email ?? ""}`.toLowerCase().includes(q));
  }, [rows, query]);

  function open(id: string) {
    sessionStorage.setItem("nx_portal_preview", id);
    router.push("/portal");
  }

  if (!isDev) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-6 text-center">
        <p className="text-sm" style={{ color: "var(--nx-muted)" }}>Preview mode is disabled in production.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[560px] px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--nx-warning-soft)", color: "var(--nx-warning)" }}>
          <FlaskConical className="h-5 w-5" strokeWidth={1.9} />
        </div>
        <div>
          <h1 className="nx-display text-xl font-semibold" style={{ color: "var(--nx-text)" }}>Portal preview</h1>
          <p className="text-xs" style={{ color: "var(--nx-faint)" }}>Dev only — open any student&apos;s portal without signing in.</p>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--nx-faint)" }} />
        <input
          className="nx-input pl-10"
          style={{ borderRadius: "999px" }}
          placeholder="Find a student…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="crm-card overflow-hidden">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="nx-skeleton m-2 h-14 rounded-xl" />)}
        {!loading && filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-sm" style={{ color: "var(--nx-faint)" }}>No students match.</p>
        )}
        {!loading &&
          filtered.map((r, i) => (
            <div
              key={r.id}
              className="crm-row"
              role="button"
              tabIndex={0}
              style={i > 0 ? { borderTop: "1px solid var(--nx-edge)", borderRadius: 0 } : { borderRadius: 0 }}
              onClick={() => open(r.id)}
              onKeyDown={(e) => e.key === "Enter" && open(r.id)}
            >
              <Avatar name={r.full_name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: "var(--nx-text)" }}>{r.full_name}</p>
                <p className="truncate text-xs" style={{ color: "var(--nx-faint)" }}>
                  {r.email || "no email on file"}
                </p>
                <JourneyStrip stage={r.stage} className="mt-1.5 max-w-[9rem]" />
              </div>
              <StatusBadge label={STAGE_META[r.stage].label} tone={STAGE_META[r.stage].tone} />
            </div>
          ))}
      </div>
    </div>
  );
}
