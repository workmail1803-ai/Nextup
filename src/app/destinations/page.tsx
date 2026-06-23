"use client";

import { useState, useEffect } from "react";
import { Check, Wallet, GraduationCap, Globe2 } from "lucide-react";
import { db, Destination } from "@/lib/supabase";
import PageHero from "@/components/ui/PageHero";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import DestinationsMap from "@/components/DestinationsMap";
import PartnerMarquee from "@/components/PartnerMarquee";

const benefits = [
  { Icon: Wallet, title: "Affordable or free", desc: "Many public universities charge little to no tuition." },
  { Icon: GraduationCap, title: "Globally recognised", desc: "Degrees respected by employers worldwide." },
  { Icon: Globe2, title: "Schengen access", desc: "Travel and explore 27 countries on one visa." },
  { Icon: Check, title: "Work while you study", desc: "Part-time work rights in most destinations." },
];

function DestinationsGrid() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.destinations
      .getAll()
      .then(setDestinations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card h-56 animate-pulse p-6">
            <div className="h-6 w-1/2 rounded bg-paper-2" />
            <div className="mt-4 h-4 w-full rounded bg-paper-2" />
            <div className="mt-2 h-4 w-3/4 rounded bg-paper-2" />
          </div>
        ))}
      </div>
    );
  }

  if (destinations.length === 0) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center text-muted">
        Destination details are being updated. Explore the map below in the meantime.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {destinations.map((dest, index) => (
        <Reveal key={dest.id} delay={(index % 3) * 0.08}>
          <article className="card card-hover h-full p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-2xl font-semibold text-ink">{dest.country}</h3>
              <span className="text-sm font-semibold text-accent">{dest.university_count}+ unis</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{dest.description}</p>
            <ul className="mt-5 space-y-2 border-t border-line pt-5">
              {dest.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-muted">
                  <Check className="h-4 w-4 flex-none text-positive" strokeWidth={2.5} />
                  {h}
                </li>
              ))}
            </ul>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

export default function DestinationsPage() {
  return (
    <>
      <PageHero
        eyebrow="Study destinations"
        title={
          <>
            One continent, <span className="accent-serif">a dozen futures.</span>
          </>
        }
        lede="Italy, Germany, Lithuania, Poland, Hungary and more — each with its own costs, culture and opportunities. Here's where our students build their lives."
      />

      <section className="bg-paper pb-8">
        <div className="container-edge">
          <DestinationsGrid />
        </div>
      </section>

      <DestinationsMap />

      {/* Why Europe */}
      <section className="bg-paper-2 py-20 md:py-28">
        <div className="container-edge">
          <SectionHeading
            align="center"
            eyebrow="Why Europe"
            title="A degree, and a continent to grow in"
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <Reveal key={b.title} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-line bg-surface p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <b.Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <PartnerMarquee />
    </>
  );
}
