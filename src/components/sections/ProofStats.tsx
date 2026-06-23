import Reveal from "@/components/ui/Reveal";
import { NumberTicker } from "@/components/magicui/number-ticker";

/* Placeholder figures — swap for verified numbers when available. */
const stats = [
  { to: 1200, prefix: "", suffix: "+", label: "Students guided", note: "since 2022" },
  { to: 95, prefix: "", suffix: "%", label: "Visa approval rate", note: "across our cohorts" },
  { to: 40, prefix: "", suffix: "+", label: "Partner universities", note: "in 6 countries" },
  { to: 0, prefix: "৳", suffix: "", label: "Hidden fees", note: "you pay everything yourself" },
];

export default function ProofStats() {
  return (
    <section className="bg-paper-2 py-16 md:py-20">
      <div className="container-edge grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="text-center md:text-left">
            <p className="font-display text-[2.6rem] font-semibold leading-none tracking-tight text-ink md:text-[3.25rem]">
              {s.prefix}
              <NumberTicker value={s.to} />
              {s.suffix}
            </p>
            <p className="mt-3 text-sm font-semibold text-ink">{s.label}</p>
            <p className="mt-0.5 text-sm text-faint">{s.note}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
