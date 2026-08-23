"use client";

// =============================================================================
// TeamPhoto — the one team photograph, shown in two places at two crops.
//
// The home page frames it 4:3 and the About page 21:9. Both read the same
// `team_photo` row, so an admin uploads once and both update; a second key
// would mean two uploads and, eventually, two different teams on one site.
//
// Until a photo exists this keeps the drawn placeholder rather than collapsing
// the frame, so the band reads as intentionally unfinished rather than broken.
// =============================================================================

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

const DEFAULT_CAPTION = "The founders on campus in Europe";

export default function TeamPhoto({
  aspect = "aspect-[4/3]",
  placeholderPrefix = "Team photo — ",
}: {
  /** Tailwind aspect class for this placement. */
  aspect?: string;
  placeholderPrefix?: string;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState(DEFAULT_CAPTION);

  useEffect(() => {
    const t = setTimeout(() => {
      supabase
        .from("site_content")
        .select("key, text_value, image_url")
        .in("key", ["team_photo", "team_photo_caption"])
        .then(({ data }) => {
          if (!data) return;
          const url = data.find((r) => r.key === "team_photo")?.image_url;
          const cap = data.find((r) => r.key === "team_photo_caption")?.text_value;
          if (url) setPhoto(url);
          if (cap) setCaption(cap);
        });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`${aspect} overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-[#efe7d9] to-[#e3d8c4] shadow-[var(--shadow-md)]`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={caption}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-center text-accent-ink/50">
          <ImageIcon className="h-10 w-10" strokeWidth={1.5} />
          <p className="mt-3 px-8 text-sm font-medium">
            {placeholderPrefix}
            {caption}
          </p>
        </div>
      )}
    </div>
  );
}
