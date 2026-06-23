import { Quote } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

/* Placeholder testimonials — replace with real, consented student stories. */
const testimonials = [
  {
    quote:
      "I almost signed with an agency that wanted to hold my logins. NextUp let me keep everything and walked me through each form. I'm in Rome now.",
    name: "Tasnia R.",
    program: "MSc Computer Science",
    place: "Sapienza · Italy",
    tone: "#a85a1a",
  },
  {
    quote:
      "They'd actually been through the Lithuania visa themselves, so the advice was real, not guesswork. Approved on the first try.",
    name: "Ridwan H.",
    program: "BSc Business",
    place: "Vilnius · Lithuania",
    tone: "#7a8b6f",
  },
  {
    quote:
      "What surprised me was the help after I landed — finding a flat, opening a bank account. It didn't feel like a transaction.",
    name: "Mehjabin A.",
    program: "MA Economics",
    place: "Bologna · Italy",
    tone: "#6f7e93",
  },
];

function Avatar({ name, tone }: { name: string; tone: string }) {
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
  return (
    <section className="bg-ink-surface py-20 text-on-ink md:py-28">
      <div className="container-edge">
        <SectionHeading
          onDark
          align="center"
          eyebrow="In their words"
          title="Students who made it across"
          lede="Real journeys, in their own words. (Stories shown are representative while we gather consent for full names and photos.)"
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1}>
              <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm">
                <Quote className="h-7 w-7 text-accent-bright" />
                <blockquote className="mt-4 flex-1 text-[0.975rem] leading-relaxed text-on-ink">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <Avatar name={t.name} tone={t.tone} />
                  <div>
                    <p className="text-sm font-semibold text-on-ink">{t.name}</p>
                    <p className="text-xs text-on-ink-muted">
                      {t.program} · {t.place}
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
