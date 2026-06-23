import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import GlobeViz from "@/components/magicui/globe-viz";

const cities = ["Dhaka", "Rome", "Milan", "Bologna", "Berlin", "Munich", "Vilnius", "Warsaw", "Budapest"];

export default function GlobeSection() {
  return (
    <section className="relative overflow-hidden bg-ink-surface py-20 text-on-ink md:py-28">
      <div className="container-edge grid items-center gap-10 lg:grid-cols-2 lg:gap-6">
        {/* Copy */}
        <div className="max-w-xl">
          <Reveal>
            <span className="eyebrow !text-accent-bright">Your reach</span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="h2 mt-4 text-balance text-on-ink">
              One application away from <span className="accent-serif !text-accent-bright">an entire continent.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lede mt-5 !text-on-ink-muted">
              Our students live and study across Europe — from Rome to Vilnius. Spin the globe: every
              glowing point is a city where someone who started exactly where you are now calls home.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <ul className="mt-7 flex flex-wrap gap-2">
              {cities.map((c) => (
                <li
                  key={c}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-sm text-on-ink"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-bright" />
                  {c}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.24} className="mt-8">
            <Button href="/destinations" variant="inverted" withArrow>
              Explore destinations
            </Button>
          </Reveal>
        </div>

        {/* Globe — smaller, softer, and only WebGL on capable devices */}
        <Reveal y={0} delay={0.1}>
          <div className="relative mx-auto aspect-square w-full max-w-[400px] md:max-w-[440px]">
            <GlobeViz />
            {/* soft floor fade so the sphere sits in the band */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-surface to-transparent" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
