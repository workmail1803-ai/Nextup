"use client";

import { useState, useEffect } from "react";
import { PhoneCall, FileSearch, Send, PlaneTakeoff } from "lucide-react";
import { db, Package } from "@/lib/supabase";
import MentorshipCard from "@/components/MentorshipCard";
import PageHero from "@/components/ui/PageHero";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";

const steps = [
  { Icon: PhoneCall, title: "Free discovery call", body: "We learn your goals, grades and budget — and tell you honestly what's realistic." },
  { Icon: FileSearch, title: "Shortlist & apply", body: "We match programs, then build strong applications, SOPs and documents together." },
  { Icon: Send, title: "Offer & visa", body: "Acceptance letters, financial prep and embassy-ready paperwork — step by step." },
  { Icon: PlaneTakeoff, title: "Arrive & settle", body: "Housing, banking and pre-arrival support so your first weeks abroad go smoothly." },
];

function PackagesGrid() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.packages
      .getAll()
      .then(setPackages)
      .catch((e) => console.error("Error fetching packages:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card h-[420px] animate-pulse">
            <div className="h-44 rounded-t-[var(--radius-lg)] bg-paper-2" />
            <div className="space-y-3 p-6">
              <div className="h-5 w-2/3 rounded bg-paper-2" />
              <div className="h-4 w-full rounded bg-paper-2" />
              <div className="h-8 w-1/3 rounded bg-paper-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <p className="text-muted">Packages are being updated. Please check back shortly.</p>
        <Button href="/contact" className="mt-6" withArrow>
          Talk to us instead
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg, index) => (
        <Reveal key={pkg.id} delay={(index % 3) * 0.08}>
          <MentorshipCard
            id={pkg.id}
            icon={pkg.icon}
            title={pkg.title}
            subtitle={pkg.subtitle || ""}
            features={pkg.features}
            price={pkg.price}
            popular={pkg.is_popular}
            images={pkg.images}
            index={index}
          />
        </Reveal>
      ))}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Mentorship packages"
        title={
          <>
            Support that scales to <span className="accent-serif">where you are.</span>
          </>
        }
        lede="From a single document review to full end-to-end mentorship, every package is transparent — you always pay fees directly and keep control of your accounts."
      />

      <section className="bg-paper pb-8">
        <div className="container-edge">
          <PackagesGrid />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-paper-2 py-20 md:py-28">
        <div className="container-edge">
          <SectionHeading
            align="center"
            eyebrow="How it works"
            title="Four steps, start to runway"
            lede="Whichever package you choose, the path is the same — clear, paced, and entirely in your control."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="relative h-full rounded-2xl border border-line bg-surface p-6">
                  <span className="font-display text-sm font-semibold text-faint">0{i + 1}</span>
                  <span className="mt-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <s.Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1} className="mt-14 flex justify-center">
            <Button href="/contact" size="lg" withArrow>
              Book your free discovery call
            </Button>
          </Reveal>
        </div>
      </section>
    </>
  );
}
