import Link from "next/link";
import { Wallet, Briefcase, Languages, ArrowUpRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";

const countries = [
  {
    name: "Italy",
    tag: "Free & low-cost public universities",
    facts: [
      { Icon: Wallet, text: "Tuition from €0–4k / year" },
      { Icon: Briefcase, text: "20 hrs/week work allowed" },
      { Icon: Languages, text: "English-taught degrees" },
    ],
  },
  {
    name: "Germany",
    tag: "No tuition at public universities",
    facts: [
      { Icon: Wallet, text: "€0 tuition, ~€11k blocked acct" },
      { Icon: Briefcase, text: "120 full / 240 half days" },
      { Icon: Languages, text: "Strong English programs" },
    ],
  },
  {
    name: "Lithuania",
    tag: "Fast visas, high approval",
    facts: [
      { Icon: Wallet, text: "Tuition €1.5k–5k / year" },
      { Icon: Briefcase, text: "Part-time work rights" },
      { Icon: Languages, text: "Affordable living costs" },
    ],
  },
  {
    name: "Poland",
    tag: "Affordable, growing tech hub",
    facts: [
      { Icon: Wallet, text: "Tuition €2k–4k / year" },
      { Icon: Briefcase, text: "Work during studies" },
      { Icon: Languages, text: "English-taught options" },
    ],
  },
];

export default function DestinationsTeaser() {
  return (
    <section className="bg-paper py-20 md:py-28">
      <div className="container-edge">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Where you could be"
            title={
              <>
                Six countries. One <span className="accent-serif">continent of options.</span>
              </>
            }
            lede="Each destination has its own rhythm — costs, intakes, work rights, and culture. We help you find the one that actually fits your life."
          />
          <div className="hidden md:block">
            <Button href="/destinations" variant="secondary" withArrow>
              All destinations
            </Button>
          </div>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {countries.map((c, i) => (
            <Reveal key={c.name} delay={i * 0.08}>
              <Link
                href="/destinations"
                className="card card-hover group flex h-full flex-col p-6"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-2xl font-semibold text-ink">{c.name}</h3>
                  <ArrowUpRight className="h-5 w-5 text-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
                <p className="mt-1.5 text-sm text-accent">{c.tag}</p>
                <ul className="mt-5 space-y-2.5 border-t border-line pt-5">
                  {c.facts.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5 text-sm text-muted">
                      <f.Icon className="h-4 w-4 flex-none text-faint" strokeWidth={1.75} />
                      {f.text}
                    </li>
                  ))}
                </ul>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 md:hidden">
          <Button href="/destinations" variant="secondary" withArrow>
            All destinations
          </Button>
        </div>
      </div>
    </section>
  );
}
