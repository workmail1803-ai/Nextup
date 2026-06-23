import type { ReactNode } from "react";
import Reveal from "./Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  onDark?: boolean;
  className?: string;
}

/** Consistent eyebrow + display title + lede block used across sections. */
export default function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  onDark = false,
  className = "",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "items-center text-center mx-auto" : "items-start text-left";
  return (
    <div className={`flex flex-col ${alignment} max-w-3xl ${className}`}>
      {eyebrow && (
        <Reveal>
          <span className={`eyebrow ${onDark ? "!text-accent-bright" : ""}`}>{eyebrow}</span>
        </Reveal>
      )}
      <Reveal delay={0.06}>
        <h2 className={`h2 mt-4 text-balance ${onDark ? "text-on-ink" : "text-ink"}`}>{title}</h2>
      </Reveal>
      {lede && (
        <Reveal delay={0.12}>
          <p className={`lede mt-5 text-pretty ${onDark ? "!text-on-ink-muted" : ""}`}>{lede}</p>
        </Reveal>
      )}
    </div>
  );
}
