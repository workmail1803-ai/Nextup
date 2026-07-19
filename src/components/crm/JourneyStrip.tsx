"use client";

import type { ClientStage } from "@/lib/types/client";

/** The forward path a student travels; `closed` is the exception exit. */
export const JOURNEY: ClientStage[] = [
  "lead",
  "meeting",
  "file_open",
  "offer",
  "visa",
  "enrolled",
];

/**
 * Signature element: a student's road to Europe as a six-notch flight path.
 * Lit notches = ground already covered; the glowing notch = where they stand.
 * A closed record shows the path in ash — travelled, but the journey ended.
 */
export function JourneyStrip({
  stage,
  className,
}: {
  stage: ClientStage;
  className?: string;
}) {
  const closed = stage === "closed";
  const idx = closed ? JOURNEY.length - 1 : JOURNEY.indexOf(stage);

  return (
    <div
      className={`crm-journey ${className ?? ""}`}
      data-closed={closed}
      role="img"
      aria-label={closed ? "Journey closed" : `Stage ${idx + 1} of ${JOURNEY.length}`}
    >
      {JOURNEY.map((s, i) => (
        <span key={s} data-lit={i <= idx} data-current={!closed && i === idx} />
      ))}
    </div>
  );
}
