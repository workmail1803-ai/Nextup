import { Check, X } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

const rows = [
  {
    label: "Who pays the university & visa fees",
    them: "The agency pays on your behalf — opaque markups",
    us: "You pay every fee directly. No middle-man markup.",
  },
  {
    label: "Your application logins",
    them: "Held by the agency. You're locked out.",
    us: "Yours. You keep every email and portal login.",
  },
  {
    label: "Who's advising you",
    them: "Sales staff working on commission",
    us: "Students who made this exact journey themselves",
  },
  {
    label: "After you land",
    them: "Relationship ends at departure",
    us: "Pre-arrival help, housing, and a community waiting",
  },
];

export default function Differentiator() {
  return (
    <section className="bg-paper py-20 md:py-28">
      <div className="container-edge">
        <SectionHeading
          eyebrow="Why we're different"
          title={
            <>
              Most agencies hold the keys.{" "}
              <span className="accent-serif">We hand them to you.</span>
            </>
          }
          lede="We started NextUp because the traditional agency model felt wrong — fees you can't see, accounts you can't access. So we built the opposite."
        />

        <Reveal delay={0.1} className="mt-12 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-sm)]">
          {/* Header */}
          <div className="grid grid-cols-1 border-b border-line md:grid-cols-[1.2fr_1fr_1fr]">
            <div className="hidden p-5 md:block" />
            <div className="border-line p-5 md:border-l">
              <p className="text-sm font-semibold text-faint">Traditional agency</p>
            </div>
            <div className="border-t border-line bg-accent-soft p-5 md:border-l md:border-t-0">
              <p className="text-sm font-semibold text-accent-ink">NextUp Mentor</p>
            </div>
          </div>

          {/* Rows */}
          {rows.map((r, i) => (
            <div
              key={r.label}
              className={`grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr] ${
                i !== rows.length - 1 ? "border-b border-line" : ""
              }`}
            >
              <div className="px-5 pb-1 pt-5 md:py-6">
                <p className="font-display text-base font-semibold text-ink">{r.label}</p>
              </div>
              <div className="flex items-start gap-3 px-5 py-4 md:border-l md:border-line md:py-6">
                <X className="mt-0.5 h-4 w-4 flex-none text-danger/70" strokeWidth={2.5} />
                <p className="text-sm text-muted">{r.them}</p>
              </div>
              <div className="flex items-start gap-3 bg-accent-soft/40 px-5 py-4 md:border-l md:border-line md:py-6">
                <Check className="mt-0.5 h-4 w-4 flex-none text-positive" strokeWidth={3} />
                <p className="text-sm font-medium text-ink">{r.us}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
