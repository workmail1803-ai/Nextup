import { GraduationCap, ShieldCheck, HeartHandshake } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

const pillars = [
  {
    Icon: GraduationCap,
    title: "Mentors who lived it",
    body: "Every person guiding you has personally applied, won a visa, and now studies in Europe. You're not getting a script — you're getting lived experience.",
  },
  {
    Icon: ShieldCheck,
    title: "Total transparency",
    body: "No hidden charges, ever. You make every payment yourself and keep access to every account. We guide the process; you stay in control of it.",
  },
  {
    Icon: HeartHandshake,
    title: "We don't stop at the airport",
    body: "Housing, bank accounts, residence permits, finding your feet in a new city — our support continues long after you land, with a student community waiting.",
  },
];

export default function ValuePillars() {
  return (
    <section className="bg-paper-2 py-20 md:py-28">
      <div className="container-edge">
        <SectionHeading
          align="center"
          eyebrow="The operating model"
          title="Built on three promises"
          lede="Everything we do comes back to these. They're the reason NextUp exists."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <article className="card card-hover h-full p-7">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <p.Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <h3 className="h3 mt-6 text-ink">{p.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{p.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
