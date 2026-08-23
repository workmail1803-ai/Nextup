"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Plane, ArrowRight, Star } from "lucide-react";
import Button from "@/components/ui/Button";
import { BorderBeam } from "@/components/magicui/border-beam";
import FeaturePhotos from "@/components/sections/FeaturePhotos";

const stages = [
  { n: "01", label: "Discovery call", sub: "Understand your goals & budget" },
  { n: "02", label: "University match", sub: "Shortlist programs that fit" },
  { n: "03", label: "Offer letter", sub: "Applications, SOPs, documents" },
  { n: "04", label: "Visa approval", sub: "Financials & embassy prep" },
  { n: "05", label: "Departure", sub: "Pre-arrival & settling in" },
];

function JourneyCard() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(reduce ? stages.length - 1 : 0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(
      () => setActive((i) => (i + 1) % (stages.length + 1)),
      1700
    );
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="relative">
      {/* Floating proof chips */}
      <motion.div
        initial={{ opacity: 0, y: 12, x: 12 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="absolute -right-3 top-8 z-20 hidden rounded-2xl border border-line bg-surface px-4 py-3 shadow-[var(--shadow-md)] sm:block"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eaf3ed] text-positive">
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">Visa approved</p>
            <p className="text-xs text-faint">Lithuania · 2025</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -12, x: -12 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="absolute -left-4 bottom-24 z-20 hidden rounded-2xl border border-line bg-surface px-4 py-3 shadow-[var(--shadow-md)] md:block"
      >
        <p className="text-xs font-medium text-faint">Offer letter secured</p>
        <p className="font-display text-sm font-semibold text-ink">Sapienza, Rome</p>
      </motion.div>

      {/* The card */}
      <motion.div
        initial={{ opacity: 0, y: 24, rotate: reduce ? 0 : -1.5 }}
        animate={{ opacity: 1, y: 0, rotate: reduce ? 0 : -1.5 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card grain relative overflow-hidden p-6 md:p-8"
      >
        <BorderBeam duration={9} size={70} borderWidth={1.5} />
        <div className="flex items-center justify-between">
          <p className="eyebrow">The NextUp Journey</p>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-positive">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-positive" />
            </span>
            In progress
          </span>
        </div>

        <ol className="relative mt-6 space-y-1">
          <span className="absolute left-[18px] top-3 bottom-3 w-px bg-line" aria-hidden />
          {stages.map((s, i) => {
            const done = i < active;
            const current = i === active;
            return (
              <li key={s.n} className="relative flex items-start gap-4 rounded-xl px-1.5 py-2.5">
                {current && (
                  <motion.span
                    layoutId="journey-active"
                    className="absolute inset-0 -z-0 rounded-xl bg-accent-soft"
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  />
                )}
                <span
                  className={`relative z-10 flex h-9 w-9 flex-none items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-300 ${
                    done
                      ? "border-positive bg-positive text-white"
                      : current
                        ? "border-accent bg-accent text-white"
                        : "border-line bg-surface text-faint"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} /> : s.n}
                </span>
                <div className="relative z-10 pt-1">
                  <p className={`text-[0.95rem] font-semibold leading-tight ${current || done ? "text-ink" : "text-muted"}`}>
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-xs text-faint">{s.sub}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Boarding-pass footer */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-dashed border-line-strong bg-paper-2 px-4 py-3">
          <div className="text-center">
            <p className="font-display text-lg font-semibold text-ink">DAC</p>
            <p className="text-[10px] uppercase tracking-wider text-faint">Dhaka</p>
          </div>
          <div className="flex flex-1 items-center px-3 text-faint">
            <span className="h-px flex-1 bg-line-strong" />
            <Plane className="mx-2 h-4 w-4 text-accent" />
            <span className="h-px flex-1 bg-line-strong" />
          </div>
          <div className="text-center">
            <p className="font-display text-lg font-semibold text-ink">EU</p>
            <p className="text-[10px] uppercase tracking-wider text-faint">Intake 2026</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient warmth — restrained, single soft source */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] h-[640px] w-[640px] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(224,146,31,0.14) 0%, rgba(224,146,31,0.04) 45%, transparent 70%)",
        }}
      />

      <div className="container-edge grid items-center gap-14 pb-20 pt-32 md:pt-40 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28">
        {/* Copy */}
        <div className="max-w-xl">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="eyebrow"
          >
            Study in Europe · From Bangladesh
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="display mt-5 text-ink"
          >
            From a dorm in Dhaka to a{" "}
            <span className="accent-serif">lecture hall in Europe.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lede mt-6"
          >
            We&apos;re a student-led mentorship team who already made this exact journey. We guide
            you from first application to boarding gate — transparently, and on your terms. You keep
            control of every payment and login.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            {/* Goes to the booking window, not the contact form. A button that
                says "book" should produce a booked time, not a message that
                someone may reply to. The nav, footer and destination pages all
                already pointed here. */}
            <Button href="/book" size="lg" withArrow>
              Book a free consultation
            </Button>
            <Button href="/services" size="lg" variant="secondary">
              Explore packages
            </Button>
          </motion.div>

          {/* Trust row — placeholder figures, easy to update */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            <div className="flex -space-x-2">
              {["#caa46a", "#a85a1a", "#7a8b6f", "#9c6b53", "#6f7e93"].map((c, i) => (
                <span
                  key={i}
                  className="h-9 w-9 rounded-full border-2 border-paper"
                  style={{ background: c }}
                  aria-hidden
                />
              ))}
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-1 text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <p className="mt-0.5 text-muted">
                <span className="font-semibold text-ink">1,200+ students</span> guided since 2022
              </p>
            </div>
          </motion.div>
        </div>

        {/* Interactive journey */}
        <div className="relative lg:pl-6">
          <JourneyCard />
        </div>
      </div>

      {/* Real photographs. Everything else on this page is a claim in text; this
          is the one place the site shows rather than asserts.

          Full-bleed rather than inside the column above: an endless strip needs
          the whole viewport to read as endless — confined to 26rem it shows one
          and a half cards and looks like a broken carousel. Renders nothing at
          all until an admin has added a photo. */}
      <div className="-mt-6 pb-10 lg:-mt-10">
        <FeaturePhotos />
      </div>

      {/* Scroll cue */}
      <div className="container-edge hidden items-center gap-2 pb-8 text-xs text-faint lg:flex">
        <ArrowRight className="h-3.5 w-3.5 rotate-90" />
        Scroll to see how it works
      </div>
    </section>
  );
}
