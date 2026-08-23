"use client";

// =============================================================================
// FeaturePhotos — an endlessly scrolling band of real photographs.
//
// The rest of the page proves things in text. This is the one place the site
// can show rather than assert, so it gets the full width of the viewport
// instead of a card inside a column.
//
// HOW THE INFINITE SCROLL ACTUALLY WORKS
// The track holds N identical copies of the photo list and slides left by the
// width of exactly ONE copy, then snaps back to zero. At the instant it snaps,
// copy 2 is sitting precisely where copy 1 began — so the seam is invisible and
// the loop never ends. Two things this depends on:
//
//   * N must cover the viewport AND the one copy that slides away, or the strip
//     runs out of photos before the reset and you see the end of it. N is
//     derived from the measured copy width, so 3 photos and 30 both work.
//   * The duration must scale with that width. A fixed 40s would crawl with
//     four photos and blur past with forty; the speed is px/second instead, so
//     the photographs always drift at the same pace.
//
// Only the first copy is real to assistive tech. The rest are aria-hidden and
// untabbable — a screen reader should hear the photo list once, not N times.
// =============================================================================

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  location: string | null;
  alt: string | null;
}

/** Pixels per second. Slow enough to read a caption without chasing it. */
const SPEED = 42;
/** Gap between cards, in px. */
const GAP = 20;
/**
 * Below this many photos a second row would just replay the same handful of
 * images alongside itself, which reads as a bug rather than a gallery.
 */
const TWO_ROW_THRESHOLD = 12;

export default function FeaturePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

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

  // Render NOTHING until we know there is something to show.
  //
  // A skeleton here was wrong: it promised a card, and when the fetch came back
  // empty the card removed itself — so a visitor saw a frame appear and vanish,
  // which reads as a broken page. Whether any photo exists is not knowable
  // before the fetch resolves, so the honest placeholder is no placeholder.
  if (!loaded || photos.length === 0) return null;

  const half = Math.ceil(photos.length / 2);
  const rows =
    photos.length >= TWO_ROW_THRESHOLD
      ? [photos.slice(0, half), photos.slice(half)]
      : [photos];

  return (
    <section
      aria-label="Photographs from our students"
      className="relative animate-[fadeUp_.6s_cubic-bezier(.22,1,.36,1)_both] py-2"
    >
      <p className="container-edge mb-5 text-[10px] uppercase tracking-[0.18em] text-faint">
        Photographs from our students
      </p>

      <div
        className="space-y-4 md:space-y-5"
        style={{
          // Feather the ends so cards drift out of view rather than being
          // guillotined by the viewport edge.
          maskImage:
            "linear-gradient(90deg, transparent 0, #000 4%, #000 96%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0, #000 4%, #000 96%, transparent 100%)",
        }}
      >
        {rows.map((row, r) => (
          <MarqueeRow
            key={r}
            photos={row}
            direction={r % 2 === 0 ? "left" : "right"}
            offset={r === 0 ? 0 : half}
            onOpen={setLightbox}
          />
        ))}
      </div>

      {lightbox !== null && (
        <Lightbox
          photos={photos}
          index={lightbox}
          onIndex={setLightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------

function MarqueeRow({
  photos,
  direction,
  offset,
  onOpen,
}: {
  photos: Photo[];
  direction: "left" | "right";
  offset: number;
  onOpen: (i: number) => void;
}) {
  const copyRef = useRef<HTMLDivElement>(null);
  const [copyW, setCopyW] = useState(0);
  const [viewW, setViewW] = useState(0);
  const [paused, setPaused] = useState(false);

  // Measure before paint. Card sizes are fixed, so the width is known without
  // waiting for a single image byte — nothing reflows when the photos arrive.
  useLayoutEffect(() => {
    const el = copyRef.current;
    if (!el) return;
    const measure = () => {
      setCopyW(el.offsetWidth);
      setViewW(window.innerWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Enough copies to cover the screen AND the one copy the track slides away.
  const count = copyW > 0 ? Math.max(2, Math.ceil(viewW / copyW) + 1) : 2;

  return (
    <div
      className="overflow-hidden motion-reduce:overflow-x-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="photo-marquee-track"
        data-paused={paused ? "true" : "false"}
        style={
          copyW > 0
            ? ({
                "--mq-w": `${copyW}px`,
                animationName:
                  direction === "left" ? "photo-marquee-left" : "photo-marquee-right",
                animationDuration: `${copyW / SPEED}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {Array.from({ length: count }).map((_, c) => (
          <div
            key={c}
            ref={c === 0 ? copyRef : undefined}
            // Copies past the first are decoration. A screen reader that walked
            // them would read the same photographs over and over.
            aria-hidden={c > 0 || undefined}
            className="flex shrink-0"
            style={{ gap: GAP, paddingRight: GAP }}
          >
            {photos.map((p, i) => (
              <Card
                key={p.id}
                photo={p}
                eager={c === 0 && i < 3}
                tabbable={c === 0}
                onOpen={() => onOpen(offset + i)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------

function Card({
  photo,
  eager,
  tabbable,
  onOpen,
}: {
  photo: Photo;
  eager: boolean;
  tabbable: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      tabIndex={tabbable ? 0 : -1}
      aria-label={photo.caption ? `View photo: ${photo.caption}` : "View photo"}
      className="group relative h-[12.5rem] w-[16.67rem] shrink-0 overflow-hidden rounded-2xl
        border border-line bg-surface shadow-[0_18px_40px_-24px_rgba(26,22,17,0.35)]
        transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]
        hover:-translate-y-1 focus-visible:-translate-y-1
        motion-reduce:transition-none motion-reduce:hover:translate-y-0
        md:h-[15.5rem] md:w-[20.67rem]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={photo.alt || photo.caption || ""}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className="h-full w-full object-cover transition-transform duration-[900ms]
          ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]
          motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />

      {/* Gradient, not a bar — the photograph stays the content. */}
      {(photo.caption || photo.location) && (
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 block bg-gradient-to-t
            from-[rgba(20,16,10,0.8)] via-[rgba(20,16,10,0.28)] to-transparent
            px-4 pb-3.5 pt-12 text-left"
        >
          {photo.caption && (
            <span className="block font-display text-[0.95rem] font-medium leading-snug text-white">
              {photo.caption}
            </span>
          )}
          {photo.location && (
            <span className="mt-0.5 block text-[0.72rem] text-white/70">{photo.location}</span>
          )}
        </span>
      )}
    </button>
  );
}

// -----------------------------------------------------------------------------

/**
 * A 4:3 crop at 300px hides most of what is in a photograph. Clicking one opens
 * it at a size where a face is a face.
 *
 * Portalled to <body> because the hero is `overflow-hidden`, and a transform on
 * any ancestor would otherwise re-anchor `position: fixed` to that ancestor.
 */
function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: Photo[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  // No `mounted` guard: this only ever mounts in response to a click, so
  // document.body is guaranteed to exist. Server rendering never reaches here.
  const go = useCallback(
    (d: 1 | -1) => onIndex((index + d + photos.length) % photos.length),
    [index, photos.length, onIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  const p = photos[index];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={p.caption || "Photograph"}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(14,11,7,0.88)]
        p-4 backdrop-blur-sm"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full
          bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {photos.length > 1 && (
        <>
          <LbArrow
            side="left"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          />
          <LbArrow
            side="right"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          />
        </>
      )}

      <figure onClick={(e) => e.stopPropagation()} className="max-h-full max-w-5xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.url}
          alt={p.alt || p.caption || ""}
          className="mx-auto max-h-[78vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
        />
        {(p.caption || p.location) && (
          <figcaption className="mt-4 text-center">
            {p.caption && <p className="font-display text-lg text-white">{p.caption}</p>}
            {p.location && <p className="mt-1 text-sm text-white/60">{p.location}</p>}
          </figcaption>
        )}
      </figure>
    </div>,
    document.body,
  );
}

function LbArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: (e: React.MouseEvent) => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 z-10 -translate-y-1/2 ${
        side === "left" ? "left-3 md:left-6" : "right-3 md:right-6"
      } flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white
        transition-colors hover:bg-white/20`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
