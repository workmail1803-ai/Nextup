"use client";

// =============================================================================
// FeaturePhotos — a slow-turning card of real photographs on the hero.
//
// The rest of the page proves things in text. This is the one place the site
// can show rather than assert, which is why it is worth a card of its own
// rather than a strip of thumbnails.
//
// Design notes, so this stays coherent with the editorial light theme:
//   * paper card, hairline border, the same soft shadow as the journey card
//   * 4:3 so a phone photo fits without cropping faces out
//   * caption over a bottom gradient, never a solid bar — the photograph is the
//     content, the words are an annotation on it
//   * one crossfade every 5s, and NOTHING moves for a reader who has asked for
//     reduced motion; they get the first photo and the dots
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  location: string | null;
  alt: string | null;
}

const INTERVAL_MS = 5000;

export default function FeaturePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      supabase
        .from("feature_photos")
        .select("id, url, caption, location, alt")
        .eq("is_active", true)
        .order("sort_order")
        .then(({ data }) => {
          setPhotos((data as Photo[]) ?? []);
          setLoaded(true);
        });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => setPhotos((p) => (setI((c) => (c + dir + p.length) % p.length), p)),
    [],
  );

  useEffect(() => {
    if (photos.length < 2 || paused) return;
    // Honour the OS setting rather than animating regardless — a carousel that
    // moves on its own is exactly what reduced-motion is asking us not to do.
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => setI((c) => (c + 1) % photos.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [photos.length, paused]);

  // Nothing configured yet: render nothing rather than an empty frame. An admin
  // sees the upload panel; a visitor should not see the absence.
  if (loaded && photos.length === 0) return null;

  if (!loaded) {
    return (
      <div
        className="mt-8 w-full max-w-[26rem] overflow-hidden rounded-2xl border border-line bg-surface"
        style={{ aspectRatio: "4 / 3" }}
        aria-hidden
      >
        <div className="h-full w-full animate-pulse bg-paper-2" />
      </div>
    );
  }

  const current = photos[i];

  return (
    <figure
      className="group relative mt-8 w-full max-w-[26rem] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_56px_-28px_rgba(26,22,17,0.35)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative w-full" style={{ aspectRatio: "4 / 3" }}>
        {photos.map((p, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.id}
            src={p.url}
            alt={p.alt || p.caption || ""}
            loading={idx === 0 ? "eager" : "lazy"}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ opacity: idx === i ? 1 : 0 }}
          />
        ))}

        {/* Gradient, not a bar — the photograph stays the content. */}
        {(current?.caption || current?.location) && (
          <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(20,16,10,0.78)] via-[rgba(20,16,10,0.28)] to-transparent px-5 pb-4 pt-12">
            {current.caption && (
              <p className="font-display text-[1.05rem] font-medium leading-snug text-white">
                {current.caption}
              </p>
            )}
            {current.location && (
              <p className="mt-0.5 text-[0.78rem] text-white/70">{current.location}</p>
            )}
          </figcaption>
        )}

        {photos.length > 1 && (
          <>
            <Arrow side="left" onClick={() => go(-1)} />
            <Arrow side="right" onClick={() => go(1)} />
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-3">
          {photos.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setI(idx)}
              aria-label={`Show photo ${idx + 1} of ${photos.length}`}
              aria-current={idx === i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: idx === i ? 20 : 6,
                background: idx === i ? "var(--color-accent)" : "var(--color-line-strong)",
              }}
            />
          ))}
        </div>
      )}
    </figure>
  );
}

function Arrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 -translate-y-1/2 ${side === "left" ? "left-3" : "right-3"}
        flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink opacity-0
        shadow-sm backdrop-blur transition-opacity duration-200
        group-hover:opacity-100 focus-visible:opacity-100`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export { ImageIcon };
