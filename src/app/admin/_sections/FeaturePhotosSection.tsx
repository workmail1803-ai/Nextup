"use client";

// =============================================================================
// FeaturePhotosSection — manage the scrolling photo band on the home page.
//
// Upload, caption, reorder, hide, delete. Deleting removes the file from
// storage as well as the row: a public bucket that only ever grows is a slow
// leak of images nobody can find but anyone can still fetch by URL.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Loader2, Trash2,
} from "lucide-react";
import { staffSupabase } from "@/lib/auth/supabase-staff";
import { TeamPhotoCard } from "./TeamPhotoCard";

interface Photo {
  id: string;
  url: string;
  path: string | null;
  caption: string | null;
  location: string | null;
  alt: string | null;
  is_active: boolean;
  sort_order: number;
}

const BUCKET = "feature-photos";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

const input =
  "w-full rounded-lg bg-[var(--ad-bg-raised)] px-3 py-2 text-[12px] text-[var(--ad-text)] border border-[var(--ad-border)] focus:border-[var(--ad-accent)] focus:outline-none transition-colors placeholder:text-[var(--ad-text-quaternary)]";

export function FeaturePhotosSection() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data, error } = await staffSupabase
      .from("feature_photos")
      .select("*")
      .order("sort_order");
    if (error) setErr(error.message);
    setPhotos((data as Photo[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      load().catch(() => setLoading(false));
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setErr(null);
    try {
      for (const file of files) {
        if (file.size > MAX_BYTES) {
          setErr(`${file.name} is over 5 MB — resize it and try again.`);
          continue;
        }
        const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        // Random filename: two photos called IMG_0042.jpg from different phones
        // would otherwise overwrite one another.
        const path = `${crypto.randomUUID()}.${ext || "jpg"}`;

        const { error: upErr } = await staffSupabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;

        const url = staffSupabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        const nextOrder = (photos.at(-1)?.sort_order ?? 0) + 1;

        const { error: insErr } = await staffSupabase
          .from("feature_photos")
          .insert({ url, path, sort_order: nextOrder });
        if (insErr) throw insErr;
      }
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function patch(p: Photo, changes: Partial<Photo>) {
    setPhotos((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...changes } : x)));
  }

  async function saveRow(p: Photo) {
    setBusy(p.id);
    try {
      const { error } = await staffSupabase
        .from("feature_photos")
        .update({
          caption: p.caption?.trim() || null,
          location: p.location?.trim() || null,
          alt: p.alt?.trim() || null,
          is_active: p.is_active,
          sort_order: p.sort_order,
        })
        .eq("id", p.id);
      if (error) throw error;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(null);
    }
  }

  async function move(p: Photo, dir: -1 | 1) {
    const idx = photos.findIndex((x) => x.id === p.id);
    const swap = photos[idx + dir];
    if (!swap) return;
    setBusy(p.id);
    try {
      await Promise.all([
        staffSupabase.from("feature_photos").update({ sort_order: swap.sort_order }).eq("id", p.id),
        staffSupabase.from("feature_photos").update({ sort_order: p.sort_order }).eq("id", swap.id),
      ]);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function remove(p: Photo) {
    if (!confirm("Remove this photo from the home page?")) return;
    setBusy(p.id);
    try {
      // File first, then the row. The other order leaves an orphan in a public
      // bucket that nothing references and nobody can find to clean up.
      if (p.path) await staffSupabase.storage.from(BUCKET).remove([p.path]);
      const { error } = await staffSupabase.from("feature_photos").delete().eq("id", p.id);
      if (error) throw error;
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not remove it.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {/* The other admin-managed image on the home page. Both live here so an
          admin looking for "a picture on the site" finds one screen, not two. */}
      <TeamPhotoCard />

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--ad-text)]">Home page photos</h2>
          <p className="mt-1 max-w-xl text-[13px] text-[var(--ad-text-tertiary)]">
            The endlessly scrolling band on the home page. Real photographs of students, campuses
            do more for trust than any claim in text — this is the one place the site shows rather
            than tells. Landscape shots work best.
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={upload}
          />
          <button
            className="flex items-center gap-2 rounded-lg bg-[var(--ad-accent)] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[var(--ad-accent-hover)] disabled:opacity-60"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Add photos"}
          </button>
        </div>
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
      ) : photos.length === 0 ? (
        <div className="admin-card px-6 py-12 text-center">
          <ImagePlus className="mx-auto h-7 w-7 text-[var(--ad-text-quaternary)]" />
          <p className="mt-3 text-[13px] font-medium text-[var(--ad-text)]">No photos yet</p>
          <p className="mt-1 text-[12px] text-[var(--ad-text-tertiary)]">
            The band stays hidden on the home page until you add one.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {photos.map((p, idx) => (
            <div key={p.id} className="admin-card overflow-hidden">
              <div className="relative bg-[var(--ad-bg-raised)]" style={{ aspectRatio: "4 / 3" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{ opacity: p.is_active ? 1 : 0.35 }}
                />
                {!p.is_active && (
                  <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Hidden
                  </span>
                )}
              </div>

              <div className="space-y-2 p-3">
                <input
                  className={input}
                  placeholder="Caption, e.g. Rafiq at Sapienza"
                  value={p.caption ?? ""}
                  onChange={(e) => patch(p, { caption: e.target.value })}
                  onBlur={() => saveRow(p)}
                />
                <input
                  className={input}
                  placeholder="Location / date, e.g. Rome — Sept 2026"
                  value={p.location ?? ""}
                  onChange={(e) => patch(p, { location: e.target.value })}
                  onBlur={() => saveRow(p)}
                />

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    <IconBtn label="Move earlier" disabled={idx === 0 || busy === p.id}
                      onClick={() => move(p, -1)}><ArrowUp className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn label="Move later" disabled={idx === photos.length - 1 || busy === p.id}
                      onClick={() => move(p, 1)}><ArrowDown className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn
                      label={p.is_active ? "Hide from the site" : "Show on the site"}
                      onClick={async () => { await patch(p, { is_active: !p.is_active }); await saveRow({ ...p, is_active: !p.is_active }); }}
                    >
                      {p.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </IconBtn>
                  </div>
                  <IconBtn label="Remove" danger onClick={() => remove(p)} disabled={busy === p.id}>
                    {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </IconBtn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
