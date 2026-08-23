"use client";

// =============================================================================
// TestimonialsSection — the student reviews on the home page.
//
// The consent checkbox is the point of this screen, not a detail on it. A
// review quoting a named student who never agreed to be quoted is a fabricated
// testimonial, and the public section keeps a disclaimer on screen for exactly
// as long as any unverified review is showing. That is why the box is unticked
// by default and why the warning below the header does not go away on its own.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Check, Eye, EyeOff, ImagePlus, Loader2, Plus, ShieldCheck, Trash2,
} from "lucide-react";
import { staffSupabase } from "@/lib/auth/supabase-staff";

interface Testimonial {
  id: string;
  quote: string;
  student_name: string;
  program: string | null;
  place: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  accent: string;
  is_verified: boolean;
  is_active: boolean;
  sort_order: number;
}

const BUCKET = "site-media";
const MAX_BYTES = 5 * 1024 * 1024;
const TONES = ["#a85a1a", "#7a8b6f", "#6f7e93", "#9c6b53", "#caa46a", "#5f6b52"];

const input =
  "w-full rounded-lg bg-[var(--ad-bg-raised)] px-3 py-2 text-[12px] text-[var(--ad-text)] border border-[var(--ad-border)] focus:border-[var(--ad-accent)] focus:outline-none transition-colors placeholder:text-[var(--ad-text-quaternary)]";
const label = "block text-[11px] font-medium text-[var(--ad-text-tertiary)] mb-1.5";

export function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await staffSupabase
      .from("testimonials")
      .select("*")
      .order("sort_order");
    if (error) setErr(error.message);
    setItems((data as Testimonial[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      load().catch(() => setLoading(false));
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  function edit(id: string, patch: Partial<Testimonial>) {
    setItems((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setSavedId(null);
  }

  async function save(t: Testimonial) {
    setBusy(t.id);
    setErr(null);
    try {
      const { error } = await staffSupabase
        .from("testimonials")
        .update({
          quote: t.quote.trim(),
          student_name: t.student_name.trim(),
          program: t.program?.trim() || null,
          place: t.place?.trim() || null,
          accent: t.accent,
          is_verified: t.is_verified,
          is_active: t.is_active,
        })
        .eq("id", t.id);
      if (error) throw error;
      setSavedId(t.id);
      setTimeout(() => setSavedId(null), 2200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(null);
    }
  }

  async function add() {
    setBusy("new");
    try {
      const nextOrder = (items.at(-1)?.sort_order ?? 0) + 1;
      const { error } = await staffSupabase.from("testimonials").insert({
        quote: "",
        student_name: "",
        accent: TONES[items.length % TONES.length],
        sort_order: nextOrder,
        is_active: false, // hidden until it has been written and checked
      });
      if (error) throw error;
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not add.");
    } finally {
      setBusy(null);
    }
  }

  async function move(t: Testimonial, dir: -1 | 1) {
    const idx = items.findIndex((x) => x.id === t.id);
    const swap = items[idx + dir];
    if (!swap) return;
    setBusy(t.id);
    try {
      await Promise.all([
        staffSupabase.from("testimonials").update({ sort_order: swap.sort_order }).eq("id", t.id),
        staffSupabase.from("testimonials").update({ sort_order: t.sort_order }).eq("id", swap.id),
      ]);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function remove(t: Testimonial) {
    if (!confirm(`Delete the review from ${t.student_name || "this student"}?`)) return;
    setBusy(t.id);
    try {
      if (t.avatar_path) await staffSupabase.storage.from(BUCKET).remove([t.avatar_path]);
      const { error } = await staffSupabase.from("testimonials").delete().eq("id", t.id);
      if (error) throw error;
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setBusy(null);
    }
  }

  async function uploadAvatar(t: Testimonial, file: File) {
    if (file.size > MAX_BYTES) {
      setErr(`${file.name} is over 5 MB — resize it and try again.`);
      return;
    }
    setBusy(t.id);
    setErr(null);
    try {
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `testimonials/${crypto.randomUUID()}.${ext || "jpg"}`;
      const { error: upErr } = await staffSupabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const url = staffSupabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

      const old = t.avatar_path;
      const { error } = await staffSupabase
        .from("testimonials")
        .update({ avatar_url: url, avatar_path: path })
        .eq("id", t.id);
      if (error) throw error;
      // Only after the row points at the new file — otherwise a failure here
      // leaves a row pointing at a photo that no longer exists.
      if (old) await staffSupabase.storage.from(BUCKET).remove([old]);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  const unverified = items.filter((t) => t.is_active && !t.is_verified).length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--ad-text)]">Student reviews</h2>
          <p className="mt-1 max-w-xl text-[13px] text-[var(--ad-text-tertiary)]">
            The three cards in the “Students who made it across” band. Photos are optional — without
            one the card shows the student&apos;s initials on a coloured circle.
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-[var(--ad-accent)] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[var(--ad-accent-hover)] disabled:opacity-60"
          onClick={add}
          disabled={busy === "new"}
        >
          {busy === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add review
        </button>
      </div>

      {unverified > 0 && (
        <div className="mb-4 flex gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-amber-400" />
          <p className="text-[12px] leading-relaxed text-amber-200/90">
            <strong className="font-semibold">
              {unverified} shown {unverified === 1 ? "review is" : "reviews are"} not marked as
              consented.
            </strong>{" "}
            While that is true, the home page adds this sentence under the heading:{" "}
            <em>“(Stories shown are representative while we gather consent for full names and
            photos.)”</em>{" "}
            Tick <strong className="font-semibold">Real, consented review</strong> once the student
            has agreed to be quoted by name, and the sentence disappears on its own.
          </p>
        </div>
      )}

      {err && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
          {err}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--ad-text-tertiary)]" />
        </div>
      ) : items.length === 0 ? (
        <div className="admin-card px-6 py-12 text-center">
          <p className="text-[13px] font-medium text-[var(--ad-text)]">No reviews yet</p>
          <p className="mt-1 text-[12px] text-[var(--ad-text-tertiary)]">
            The section hides itself on the home page until you add one.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((t, idx) => (
            <Row
              key={t.id}
              t={t}
              idx={idx}
              total={items.length}
              busy={busy === t.id}
              saved={savedId === t.id}
              onEdit={edit}
              onSave={save}
              onMove={move}
              onRemove={remove}
              onUpload={uploadAvatar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------

function Row({
  t, idx, total, busy, saved, onEdit, onSave, onMove, onRemove, onUpload,
}: {
  t: Testimonial;
  idx: number;
  total: number;
  busy: boolean;
  saved: boolean;
  onEdit: (id: string, p: Partial<Testimonial>) => void;
  onSave: (t: Testimonial) => void;
  onMove: (t: Testimonial, d: -1 | 1) => void;
  onRemove: (t: Testimonial) => void;
  onUpload: (t: Testimonial, f: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="admin-card p-5">
      <div className="flex items-start gap-4">
        <button
          onClick={() => fileRef.current?.click()}
          title="Upload a photo"
          className="group relative h-14 w-14 flex-none overflow-hidden rounded-full"
          style={{ background: t.avatar_url ? undefined : t.accent }}
        >
          {t.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[15px] font-semibold text-white">
              {t.student_name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2) || "?"}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
            <ImagePlus className="h-4 w-4 text-white" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(t, f);
            e.target.value = "";
          }}
        />

        <div className="grid flex-1 grid-cols-2 gap-2">
          <input
            className={input}
            placeholder="Student name, e.g. Tasnia R."
            value={t.student_name}
            onChange={(e) => onEdit(t.id, { student_name: e.target.value })}
          />
          <div className="flex items-center gap-1.5">
            {TONES.map((c) => (
              <button
                key={c}
                onClick={() => onEdit(t.id, { accent: c })}
                aria-label={`Use ${c}`}
                className="h-5 w-5 rounded-full transition-transform hover:scale-110"
                style={{
                  background: c,
                  outline: t.accent === c ? "2px solid var(--ad-text)" : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
          <input
            className={input}
            placeholder="Programme, e.g. MSc Computer Science"
            value={t.program ?? ""}
            onChange={(e) => onEdit(t.id, { program: e.target.value })}
          />
          <input
            className={input}
            placeholder="University · country"
            value={t.place ?? ""}
            onChange={(e) => onEdit(t.id, { place: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-3">
        <label className={label}>Quote</label>
        <textarea
          className={`${input} min-h-[86px] resize-y leading-relaxed`}
          placeholder="What the student said, in their own words."
          value={t.quote}
          onChange={(e) => onEdit(t.id, { quote: e.target.value })}
        />
      </div>

      <label
        className={`mt-3 flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${
          t.is_verified
            ? "border-emerald-500/25 bg-emerald-500/10"
            : "border-amber-500/25 bg-amber-500/10"
        }`}
      >
        <input
          type="checkbox"
          className="mt-0.5"
          checked={t.is_verified}
          onChange={(e) => onEdit(t.id, { is_verified: e.target.checked })}
        />
        <span className="text-[12px] leading-snug">
          <span className="font-semibold text-[var(--ad-text)]">Real, consented review</span>
          <span className="mt-0.5 block text-[var(--ad-text-tertiary)]">
            This is a real student who agreed to be quoted by name. Leave unticked for placeholder
            copy — the home page says so on your behalf while it is.
          </span>
        </span>
      </label>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--ad-border-subtle)] pt-3">
        <div className="flex items-center gap-1">
          <IconBtn label="Move earlier" disabled={idx === 0 || busy} onClick={() => onMove(t, -1)}>
            <ArrowUp className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label="Move later" disabled={idx === total - 1 || busy} onClick={() => onMove(t, 1)}>
            <ArrowDown className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn
            label={t.is_active ? "Showing on the site" : "Hidden from the site"}
            onClick={() => onSave({ ...t, is_active: !t.is_active })}
          >
            {t.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </IconBtn>
          <IconBtn label="Delete" danger onClick={() => onRemove(t)} disabled={busy}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
        <button
          className="flex items-center gap-1.5 rounded-lg bg-[var(--ad-accent)] px-3.5 py-2 text-[12px] font-medium text-white hover:bg-[var(--ad-accent-hover)] disabled:opacity-60"
          onClick={() => onSave(t)}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5" />
          ) : null}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

function IconBtn({
  children, label, onClick, disabled, danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md p-1.5 transition-colors disabled:opacity-30 ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-[var(--ad-text-tertiary)] hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text)]"
      }`}
    >
      {children}
    </button>
  );
}
