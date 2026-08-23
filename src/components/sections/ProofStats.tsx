"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { supabase } from "@/lib/supabase";

interface Stat {
  key: string;
  value: number;
  prefix: string;
  suffix: string;
  label: string;
  note: string | null;
}

/**
 * What the page shows before the fetch resolves, and what it falls back to if
 * the fetch fails. Kept identical to the seeded rows in migration 0027, so a
 * network hiccup degrades to the same figures rather than to an empty band
 * where the proof used to be.
 */
const FALLBACK: Stat[] = [
  { key: "students_guided", value: 1200, prefix: "", suffix: "+", label: "Students guided", note: "since 2022" },
  { key: "visa_approval", value: 95, prefix: "", suffix: "%", label: "Visa approval rate", note: "across our cohorts" },
  { key: "partner_universities", value: 40, prefix: "", suffix: "+", label: "Partner universities", note: "in 6 countries" },
  { key: "hidden_fees", value: 0, prefix: "৳", suffix: "", label: "Hidden fees", note: "you pay everything yourself" },
];

export default function ProofStats() {
  const [stats, setStats] = useState<Stat[]>(FALLBACK);

  useEffect(() => {
    // Deferred so the first paint is not blocked on a round-trip: the fallback
    // is already correct, and swapping it a moment later is invisible.
    const t = setTimeout(() => {
      supabase
        .from("site_stats")
        .select("key, value, prefix, suffix, label, note")
        .eq("is_active", true)
        .order("sort_order")
        .then(({ data }) => {
          if (data?.length) setStats(data as Stat[]);
        });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="bg-paper-2 py-16 md:py-20">
      <div className="container-edge grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.key} delay={i * 0.08} className="text-center md:text-left">
            <p className="font-display text-[2.6rem] font-semibold leading-none tracking-tight text-ink md:text-[3.25rem]">
              {s.prefix}
              <NumberTicker value={s.value} />
              {s.suffix}
            </p>
            <p className="mt-3 text-sm font-semibold text-ink">{s.label}</p>
            {s.note && <p className="mt-0.5 text-sm text-faint">{s.note}</p>}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
