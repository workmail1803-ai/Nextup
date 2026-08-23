"use client";

// =============================================================================
// TeamPhotoCard — the single team photograph, used in two places.
//
// It appears 4:3 on the home page and 21:9 on /about, both object-cover, so a
// wide landscape shot survives both crops and a portrait one loses heads in the
// second. The preview below shows both crops for that reason: an admin should
// find that out here, not by visiting /about afterwards.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { staffSupabase } from "@/lib/auth/supabase-staff";

const BUCKET = "site-media";
const MAX_BYTES = 5 * 1024 * 1024;

const input =
  "w-full rounded-lg bg-[var(--ad-bg-raised)] px-3 py-2 text-[12px] text-[var(--ad-text)] border border-[var(--ad-border)] focus:border-[var(--ad-accent)] focus:outline-none transition-colors placeholder:text-[var(--ad-text-quaternary)]";

export function TeamPhotoCard() {
  const [url, setUrl] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await staffSupabase
      .from("site_content")
      .select("key, text_value, image_url, image_path")
      .in("key", ["team_photo", "team_photo_caption"]);
    const photo = data?.find((r) => r.key === "team_photo");
    const cap = data?.find((r) => r.key === "team_photo_caption");
    setUrl(photo?.image_url ?? null);
    setPath(photo?.image_path ?? null);
    setCaption(cap?.text_value ?? "");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function upload(file: File) {
    if (file.size > MAX_BYTES) {
      setErr(`${file.name} is over 5 MB — resize it and try again.`);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const next = `team/${crypto.randomUUID()}.${ext || "jpg"}`;
      const { error: upErr } = await staffSupabase.storage
        .from(BUCKET)
        .upload(next, file, { contentType: file.type });
      if (upErr) throw upErr;
      const publicUrl = staffSupabase.storage.from(BUCKET).getPublicUrl(next).data.publicUrl;

      const old = path;
      const { error } = await staffSupabase
        .from("site_content")
        .upsert({ key: "team_photo", image_url: publicUrl, image_path: next, updated_at: new Date().toISOString() });
      if (error) throw error;
      // Remove the replaced file only once the row points at the new one.
      if (old) await staffSupabase.storage.from(BUCKET).remove([old]);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveCaption() {
    setBusy(true);
    try {
      const { error } = await staffSupabase.from("site_content").upsert({
        key: "team_photo_caption",
        text_value: caption.trim() || null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    if (!confirm("Remove the team photo? Both pages go back to the placeholder.")) return;
    setBusy(true);
    try {
      if (path) await staffSupabase.storage.from(BUCKET).remove([path]);
      const { error } = await staffSupabase
        .from("site_content")
        .upsert({ key: "team_photo", image_url: null, image_path: null, updated_at: new Date().toISOString() });
      if (error) throw error;
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not remove it.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-card mb-8 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-[var(--ad-text)]">Team photo</h3>
          <p className="mt-1 max-w-lg text-[12px] text-[var(--ad-text-tertiary)]">
            Shown in the “Our story” band on the home page and again, wider, on the About page. One
            upload fills both. A wide landscape shot works best — the About crop is very letterboxed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
          <button
            className="flex items-center gap-2 rounded-lg bg-[var(--ad-accent)] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[var(--ad-accent-hover)] disabled:opacity-60"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {url ? "Replace" : "Upload"}
          </button>
          {url && (
            <button
              className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-30"
              title="Remove photo"
              onClick={removePhoto}
              disabled={busy}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {err && (
        <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
          {err}
        </div>
      )}

      {url ? (
        <div className="grid gap-3 sm:grid-cols-[1fr_1.6fr]">
          <Crop url={url} ratio="4 / 3" caption="Home page" />
          <Crop url={url} ratio="21 / 9" caption="About page" />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--ad-border)] px-6 py-10 text-center">
          <ImagePlus className="mx-auto h-6 w-6 text-[var(--ad-text-quaternary)]" />
          <p className="mt-2 text-[12px] text-[var(--ad-text-tertiary)]">
            No team photo yet — both pages show a drawn placeholder.
          </p>
        </div>
      )}

      <div className="mt-4 flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1.5 block text-[11px] font-medium text-[var(--ad-text-tertiary)]">
            Caption (alt text, and the placeholder wording until a photo is up)
          </label>
          <input
            className={input}
            placeholder="The founders on campus in Europe"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
        <button
          className="flex items-center gap-1.5 rounded-lg border border-[var(--ad-border)] px-3.5 py-2 text-[12px] font-medium text-[var(--ad-text)] hover:bg-[var(--ad-surface-hover)] disabled:opacity-60"
          onClick={saveCaption}
          disabled={busy}
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : null}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

function Crop({ url, ratio, caption }: { url: string; ratio: string; caption: string }) {
  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-[var(--ad-border)]" style={{ aspectRatio: ratio }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </div>
      <p className="mt-1.5 text-[11px] text-[var(--ad-text-quaternary)]">
        {caption} · {ratio.replace(" / ", ":")}
      </p>
    </div>
  );
}
