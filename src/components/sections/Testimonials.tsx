"use client";

// =============================================================================
// Testimonials — student reviews, editable in Admin → Reviews.
//
// THE DISCLAIMER IS NOT DECORATION.
// These three quotes shipped as placeholders, under a line admitting they were
// "representative while we gather consent for full names and photos". Making
// them editable without keeping that admission would turn invented copy into
// what reads as a real customer review — which is a fabricated testimonial, on
// a page asking families to hand over their savings.
//
// So the sentence is driven by data, not by whoever last edited the section:
// each review carries `is_verified`, false until someone confirms a real person
// consented to be quoted, and the disclaimer stays on screen while any
// unverified review is showing. Nobody has to remember to add it back.
// =============================================================================

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { supabase } from "@/lib/supabase";

interface Testimonial {
  id: string;
  quote: string;
  student_name: string;
  program: string | null;
  place: string | null;
  avatar_url: string | null;
  accent: string;
  is_verified: boolean;
}

/**
 * What renders before the fetch resolves, and what it falls back to if the
 * fetch fails. Identical to the rows seeded in migration 0029, so a network
 * hiccup degrades to the same three cards rather than to an empty section.
 */
const FALLBACK: Testimonial[] = [
  {
    id: "f1",
    quote:
      "I almost signed with an agency that wanted to hold my logins. NextUp let me keep everything and walked me through each form. I'm in Rome now.",
    student_name: "Tasnia R.",
    program: "MSc Computer Science",
    place: "Sapienza · Italy",
    avatar_url: null,
    accent: "#a85a1a",
    is_verified: false,
  },
  {
    id: "f2",
    quote:
      "They'd actually been through the Lithuania visa themselves, so the advice was real, not guesswork. Approved on the first try.",
    student_name: "Ridwan H.",
    program: "BSc Business",
    place: "Vilnius · Lithuania",
    avatar_url: null,
    accent: "#7a8b6f",
    is_verified: false,
  },
  {
    id: "f3",
    quote:
      "What surprised me was the help after I landed — finding a flat, opening a bank account. It didn't feel like a transaction.",
    student_name: "Mehjabin A.",
    program: "MA Economics",
    place: "Bologna · Italy",
    avatar_url: null,
    accent: "#6f7e93",
    is_verified: false,
  },
];

const DEFAULT_LEDE = "Real journeys, in their own words.";
const CONSENT_NOTE =
  "(Stories shown are representative while we gather consent for full names and photos.)";

function Avatar({ name, tone, url }: { name: string; tone: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-11 w-11 flex-none rounded-full object-cover"
        loading="lazy"
        decoding="async"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  return (
    <span
      className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-sm font-semibold text-white"
      style={{ background: tone }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>(FALLBACK);
  const [lede, setLede] = useState(DEFAULT_LEDE);

  useEffect(() => {
    // Deferred so first paint is not blocked on a round-trip: the fallback is
    // already correct, and swapping it a moment later is invisible.
    const t = setTimeout(() => {
      supabase
        .from("testimonials")
        .select("id, quote, student_name, program, place, avatar_url, accent, is_verified")
        .eq("is_active", true)
        .order("sort_order")
        .then(({ data }) => {
          if (data?.length) setItems(data as Testimonial[]);
        });

      supabase
        .from("site_content")
        .select("text_value")
        .eq("key", "testimonials_lede")
        .maybeSingle()
        .then(({ data }) => {
          if (data?.text_value) setLede(data.text_value);
        });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (items.length === 0) return null;

  const needsConsentNote = items.some((t) => !t.is_verified);

  return (
    <section className="bg-ink-surface py-20 text-on-ink md:py-28">
      <div className="container-edge">
        <SectionHeading
          onDark
          align="center"
          eyebrow="In their words"
          title="Students who made it across"
          lede={needsConsentNote ? `${lede} ${CONSENT_NOTE}` : lede}
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.1}>
              <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm">
                <Quote className="h-7 w-7 text-accent-bright" />
                <blockquote className="mt-4 flex-1 text-[0.975rem] leading-relaxed text-on-ink">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <Avatar name={t.student_name} tone={t.accent} url={t.avatar_url} />
                  <div>
                    <p className="text-sm font-semibold text-on-ink">{t.student_name}</p>
                    <p className="text-xs text-on-ink-muted">
                      {[t.program, t.place].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
