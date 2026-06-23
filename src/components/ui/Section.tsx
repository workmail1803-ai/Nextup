import type { ElementType, ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  id?: string;
  /** Warm sand alternating background. */
  alt?: boolean;
  /** Inverted warm-black band. */
  dark?: boolean;
  className?: string;
  containerClassName?: string;
  /** Set false to opt out of the centered max-width container. */
  bleed?: boolean;
  as?: ElementType;
}

export default function Section({
  children,
  id,
  alt = false,
  dark = false,
  className = "",
  containerClassName = "",
  bleed = false,
  as: Tag = "section",
}: SectionProps & { bleed?: boolean }) {
  const bg = dark ? "bg-ink-surface text-on-ink" : alt ? "bg-paper-2" : "bg-paper";
  return (
    <Tag
      id={id}
      className={`relative py-20 md:py-28 ${bg} ${className}`}
    >
      {bleed ? (
        children
      ) : (
        <div className={`container-edge ${containerClassName}`}>{children}</div>
      )}
    </Tag>
  );
}
