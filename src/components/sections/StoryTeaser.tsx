import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import TeamPhoto from "@/components/sections/TeamPhoto";

export default function StoryTeaser() {
  return (
    <section className="bg-paper py-20 md:py-28">
      <div className="container-edge grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Team photo — uploaded in Admin → Home photos */}
        <Reveal y={28}>
          <div className="relative">
            <TeamPhoto aspect="aspect-[4/3]" />
            <div className="absolute -bottom-5 -right-3 hidden rounded-2xl border border-line bg-surface px-5 py-4 shadow-[var(--shadow-md)] sm:block">
              <p className="font-display text-2xl font-semibold text-ink">Est. 2022</p>
              <p className="text-xs text-faint">Founded by students abroad</p>
            </div>
          </div>
        </Reveal>

        {/* Copy */}
        <div className="max-w-xl">
          <Reveal>
            <span className="eyebrow">Our story</span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="h2 mt-4 text-balance text-ink">
              We were you, <span className="accent-serif">two years ago.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lede mt-5">
              NextUp wasn&apos;t founded as an agency. It was founded by students already living and
              studying across Europe — people who survived the visa stress, the documentation, the
              money worries, and the culture shock.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="mt-4 leading-relaxed text-muted">
              Because we lived it, we know exactly what guidance a student needs — and what&apos;s just
              noise. We guide, we support, and we walk beside you. Students first, mentors by
              experience.
            </p>
          </Reveal>
          <Reveal delay={0.24} className="mt-8">
            <Button href="/about" variant="secondary" withArrow>
              Read our full story
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
