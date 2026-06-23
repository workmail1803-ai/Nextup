import type { ReactNode } from "react";
import Reveal from "./Reveal";

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
}

/** Consistent inner-page hero with navbar clearance + ambient warmth. */
export default function PageHero({
  eyebrow,
  title,
  lede,
  children,
  align = "left",
}: PageHeroProps) {
  const alignment = align === "center" ? "mx-auto text-center items-center" : "items-start";
  return (
    <section className="relative overflow-hidden bg-paper pt-32 pb-14 md:pt-40 md:pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-[-8%] h-[520px] w-[520px] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(224,146,31,0.13) 0%, rgba(224,146,31,0.03) 50%, transparent 72%)",
        }}
      />
      <div className={`container-edge flex max-w-3xl flex-col ${alignment}`}>
        <Reveal>
          <span className="eyebrow">{eyebrow}</span>
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="display mt-5 text-balance text-ink">{title}</h1>
        </Reveal>
        {lede && (
          <Reveal delay={0.12}>
            <p className="lede mt-6 text-pretty">{lede}</p>
          </Reveal>
        )}
        {children && (
          <Reveal delay={0.18}>
            <div className="mt-9">{children}</div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
