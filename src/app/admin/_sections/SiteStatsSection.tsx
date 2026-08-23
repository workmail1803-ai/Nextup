"use client";

// =============================================================================
// SiteStatsSection — the four figures under the hero on the home page.
//
// These are public claims about outcomes ("95% visa approval rate"), so the
// wording is editable alongside the number. "95%" labelled "Visa approval rate"
// is a different assertion from "95%" labelled "Visa approval rate for completed
// applications", and only one of them may be defensible. Whoever is accountable
// for the claim should be able to correct either half without a developer.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { staffSupabase } from "@/lib/auth/supabase-staff";

interface Stat {
  id: string;
  key: string;
  value: number;
  prefix: string;
  suffix: string;
  label: string;
  note: string | null;
  is_active: boolean;
  sort_order: number;
}

const input =
  "w-full rounded-lg bg-[var(--ad-bg-raised)] px-3 py-2 text-[13px] text-[var(--ad-text)] border border-[var(--ad-border)] focus:border-[var(--ad-accent)] focus:outline-none transition-colors placeholder:text-[var(--ad-text-quaternary)]";
const label = "block text-[11px] font-medium text-[var(--ad-text-tertiary)] mb-1.5";

export function SiteStatsSection() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await staffSupabase
      .from("site_stats")
      .select("*")
      .order("sort_order");
    if (error) setErr(error.message);
    setStats((data as Stat[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      load().catch(() => setLoading(false));
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  function edit(id: string, patch: Partial<Stat>) {
    setStats((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setSavedId(null);
  }

  async function save(s: Stat) {
    setSavingId(s.id);
    setErr(null);
    try {
      const { error } = await staffSupabase
        .from("site_stats")
        .update({
          value: Number(s.value) || 0,
          prefix: s.prefix,
          suffix: s.suffix,
          label: s.label.trim(),
          note: s.note?.trim() || null,
          is_active: s.is_active,
        })
        .eq("id", s.id);
      if (error) throw error;
      setSavedId(s.id);
      setTimeout(() => setSavedId(null), 2200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold text-[var(--ad-text)]">Home page figures</h2>
        <p className="mt-1 text-[13px] text-[var(--ad-text-tertiary)]">
          The four numbers under the hero. These are public claims about your results — keep them
          true, and change the wording as well as the number when the claim shifts.
        </p>
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
          {err}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--ad-text-tertiary)]" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {stats.map((s) => (
            <div key={s.id} className="admin-card">
              <div className="p-5">
                {/* What the visitor actually sees, rendered from the current
                    values — so an edit is judged as it will appear, not as
                    four disconnected form fields. */}
                <div className="mb-4 rounded-lg bg-[var(--ad-bg-raised)] px-4 py-3 text-center">
                  <p className="text-[26px] font-semibold leading-none text-[var(--ad-text)]">
                    {s.prefix}
                    {Number(s.value).toLocaleString()}
                    {s.suffix}
                  </p>
                  <p className="mt-2 text-[12px] font-semibold text-[var(--ad-text)]">{s.label}</p>
                  <p className="text-[11px] text-[var(--ad-text-quaternary)]">{s.note}</p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className={label}>Before</label>
                    <input className={input} value={s.prefix} placeholder="৳"
                      onChange={(e) => edit(s.id, { prefix: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className={label}>Number</label>
                    <input className={input} inputMode="decimal" value={s.value}
                      onChange={(e) => edit(s.id, { value: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className={label}>After</label>
                    <input className={input} value={s.suffix} placeholder="+"
                      onChange={(e) => edit(s.id, { suffix: e.target.value })} />
                  </div>
                </div>

                <div className="mt-3">
                  <label className={label}>Label</label>
                  <input className={input} value={s.label}
                    onChange={(e) => edit(s.id, { label: e.target.value })} />
                </div>

                <div className="mt-3">
                  <label className={label}>Small print underneath</label>
                  <input className={input} value={s.note ?? ""} placeholder="optional"
                    onChange={(e) => edit(s.id, { note: e.target.value })} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-[12px] text-[var(--ad-text-tertiary)]">
                    <input type="checkbox" checked={s.is_active}
                      onChange={(e) => edit(s.id, { is_active: e.target.checked })} />
                    Show on the site
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-lg border border-[var(--ad-border)] px-3 py-2 text-[12px] text-[var(--ad-text-tertiary)] hover:text-[var(--ad-text)]"
                      onClick={() => load()}
                      title="Discard changes to this card"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="flex items-center gap-1.5 rounded-lg bg-[var(--ad-accent)] px-3.5 py-2 text-[12px] font-medium text-white hover:bg-[var(--ad-accent-hover)] disabled:opacity-60"
                      onClick={() => save(s)}
                      disabled={savingId === s.id}
                    >
                      {savingId === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : savedId === s.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : null}
                      {savedId === s.id ? "Saved" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
