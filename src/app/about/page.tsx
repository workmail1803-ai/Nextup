import TeamPhoto from "@/components/sections/TeamPhoto";
import PageHero from "@/components/ui/PageHero";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import DestinationsMap from "@/components/DestinationsMap";
import ConnectBeam from "@/components/sections/ConnectBeam";
import PartnerMarquee from "@/components/PartnerMarquee";

const principles = [
  {
    n: "01",
    title: "Lived experience over scripts",
    body: "Everyone who guides you has personally applied, won a visa, and now studies in Europe. Advice comes from memory, not a manual.",
  },
  {
    n: "02",
    title: "Radical transparency",
    body: "No hidden charges. You see every cost, make every payment yourself, and keep access to every account and email.",
  },
  {
    n: "03",
    title: "You stay in control",
    body: "We guide the process; you own it. Your applications and logins are always yours — never locked behind an agency.",
  },
  {
    n: "04",
    title: "We don't disappear at departure",
    body: "Housing, banking, residence permits, community — our support continues long after the plane lands.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About NextUp Mentor"
        title={
          <>
            We were the ones lost in this process.{" "}
            <span className="accent-serif">So we built the guide we wished we&apos;d had.</span>
          </>
        }
        lede="NextUp Mentor is a student-led study-abroad consultancy in Bangladesh, focused on European destinations — built on honesty, transparency, and real experience."
      />

      {/* Our story */}
      <section className="bg-paper py-16 md:py-24">
        <div className="container-edge grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <span className="eyebrow">Our story</span>
            <h2 className="h2 mt-4 text-balance text-ink">
              Founded by students, <span className="accent-serif">not salespeople.</span>
            </h2>
          </Reveal>

          <div className="max-w-2xl space-y-5 text-[1.05rem] leading-relaxed text-muted">
            <Reveal>
              <p>
                NextUp Mentor was founded by current and former students already living and studying
                across Europe. We started this not as a traditional agency, but as people who
                personally experienced the challenges, confusion, and struggles of moving abroad.
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <p>
                We have gone through the same visa processes, documentation pressure, financial
                concerns, cultural adjustments, and academic transitions that upcoming students are
                about to face. Because we lived it ourselves, we understand exactly what guidance a
                student truly needs — and what they don&apos;t.
              </p>
            </Reveal>
            <Reveal delay={0.12}>
              <p>
                Instead of the typical agency formula, we believe in complete transparency and
                student control. No hidden charges, no unclear procedures, no restricted access.
                Students keep full access to their applications and make payments directly
                themselves. Our role is to guide, support, and make sure every step is taken
                correctly and confidently.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Manifesto pull-quote */}
        <div className="container-edge mt-16">
          <Reveal>
            <blockquote className="mx-auto max-w-4xl border-l-2 border-accent pl-6 md:pl-10">
              <p className="font-display text-2xl font-medium italic leading-snug text-ink md:text-[2rem]">
                “To guide students toward the life we are already living — with honesty, clarity, and
                real experience behind every piece of advice.”
              </p>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* Team photo — the same upload as the home page, cropped wider */}
      <section className="bg-paper-2 py-16 md:py-24">
        <div className="container-edge">
          <Reveal y={28}>
            <TeamPhoto aspect="aspect-[21/9]" />
          </Reveal>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-paper py-20 md:py-28">
        <div className="container-edge">
          <SectionHeading
            eyebrow="What we stand for"
            title="Four principles we won't bend"
            lede="They're the reason students — and their families — trust us with one of the biggest decisions of their lives."
          />
          <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {principles.map((p, i) => (
              <Reveal key={p.n} delay={(i % 2) * 0.08}>
                <div className="flex gap-5 border-t border-line pt-6">
                  <span className="font-display text-2xl font-semibold text-accent">{p.n}</span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink">{p.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{p.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ConnectBeam />
      <DestinationsMap />
      <PartnerMarquee />
    </>
  );
}
